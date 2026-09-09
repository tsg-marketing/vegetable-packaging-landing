"""
Business: Загружает YML-фид t-sib.ru, отдаёт товары раздела паллетоупаковщиков (категории 332, 452, 333, 334).
Кэш: данные обновляются 3 раза в сутки в 07:00, 13:00 и 19:00 по Новосибирску (UTC+7).
Args: event с httpMethod (GET/OPTIONS); context — объект с request_id.
Returns: JSON {products: [...], brands: [...], updatedAt, nextUpdate} с фото, параметрами, видео и описанием.
"""
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from typing import Any

FEED_URL = "https://t-sib.ru/upload/catalog.xml"
TARGET_CATEGORIES = {"332", "452", "333", "334"}

BRAND_ORDER = ["ТЕХНОСИБ", "Robopac (Робопак)", "Hualian"]

HIDDEN_PARAM_MARKERS = ("видео в фид", "фид авито", "avito", "guid", "наличие ", "картинки товара")

NSK_TZ = timezone(timedelta(hours=7))
REFRESH_TIMES_NSK = [(7, 0), (13, 0), (19, 0)]

_CACHE: dict = {
    'payload': None,
    'updated_at': None,
    'next_update': None,
}


def _next_refresh_after(now_utc: datetime) -> datetime:
    now_nsk = now_utc.astimezone(NSK_TZ)
    candidates = []
    for day_offset in (0, 1):
        base = now_nsk + timedelta(days=day_offset)
        for hour, minute in REFRESH_TIMES_NSK:
            slot = base.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if slot > now_nsk:
                candidates.append(slot)
    return min(candidates).astimezone(timezone.utc)


def _abs_url(url: str) -> str:
    url = (url or '').strip()
    if not url:
        return ''
    if url.startswith('//'):
        return 'https:' + url
    if url.startswith('/'):
        return 'https://t-sib.ru' + url
    return url


def _is_hidden_param(name: str) -> bool:
    low = name.lower()
    return any(marker in low for marker in HIDDEN_PARAM_MARKERS)


def _detect_kind(name: str, params: dict) -> str:
    """Определяет тип позиции: обмотчик, паллетайзер или аксессуар."""
    low = name.lower()
    if 'паллетайзер' in low or 'палетайзер' in low:
        return 'palletizer'
    accessory_words = ('рампа', 'весов', 'взвешивающая', 'принтер', 'запчаст', 'комплект',
                       'опция', 'каретка для', 'платформа для', 'датчик', 'ограждение')
    if any(w in low for w in accessory_words):
        return 'accessory'
    return 'wrapper'


def _mobility(name: str, params: dict) -> str:
    low = name.lower()
    type_param = (params.get('Тип оборудования') or '').lower()
    if 'мобильн' in low or 'мобильн' in type_param:
        return 'mobile'
    if 'рукав' in type_param or 'рукой' in low or 'консольн' in low:
        return 'arm'
    return 'stationary'


def _fetch_and_parse() -> dict:
    req = urllib.request.Request(FEED_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=45) as resp:
        xml_data = resp.read()

    root = ET.fromstring(xml_data)
    shop = root.find('shop')
    if shop is None:
        raise RuntimeError('No shop element in feed')

    cats_el = shop.find('categories')
    cat_name = {}
    if cats_el is not None:
        for c in cats_el.findall('category'):
            cat_name[c.get('id', '')] = (c.text or '').strip()

    offers_el = shop.find('offers')
    if offers_el is None:
        raise RuntimeError('No offers element in feed')

    products = []
    order = 0
    for offer in offers_el.findall('offer'):
        cat = (offer.findtext('categoryId', '') or '').strip()
        if cat not in TARGET_CATEGORIES:
            continue

        raw_params = {}
        params = []
        video = ''
        for prm in offer.findall('param'):
            pname = (prm.get('name') or '').strip()
            pval = (prm.text or '').strip()
            if not pname or not pval:
                continue
            raw_params[pname] = pval
            low = pname.lower()
            if 'видео' in low and ('ссылк' in low or 'фид' in low or 'avito' in low):
                if not video and ('http' in pval):
                    video = pval.strip()
                continue
            if _is_hidden_param(pname):
                continue
            params.append({'name': pname, 'value': pval})

        params.sort(key=lambda p: p['name'].lower())

        pictures = []
        for p in offer.findall('picture'):
            u = _abs_url(p.text or '')
            if u and u not in pictures:
                pictures.append(u)

        extra = raw_params.get('Картинки товара', '')
        if extra:
            for part in re.split(r'[;,\s]+', extra):
                u = _abs_url(part)
                if u.startswith('http') and u not in pictures:
                    pictures.append(u)

        price_raw = (offer.findtext('price', '') or '').strip()
        try:
            price_num = float(price_raw) if price_raw else 0
        except ValueError:
            price_num = 0

        name = (offer.findtext('name', '') or '').strip()
        brand = raw_params.get('Бренд', '').strip() or 'Другое'

        available_attr = (offer.get('available') or '').strip().lower() == 'true'
        stock_params = [
            raw_params.get('Наличие Новосибирск', ''),
            raw_params.get('Наличие МОСКВА', ''),
            raw_params.get('Наличие Челябинск', ''),
        ]
        in_stock = available_attr or any(
            s and s.strip().lower() not in ('нет', 'нет в наличии', '0', 'под заказ')
            for s in stock_params
        )

        order += 1
        products.append({
            'id': offer.get('id', ''),
            'categoryId': cat,
            'categoryName': cat_name.get(cat, ''),
            'name': name,
            'brand': brand,
            'vendor': (offer.findtext('vendor', '') or '').strip(),
            'price': price_num,
            'priceText': price_raw,
            'currency': (offer.findtext('currencyId', 'RUR') or 'RUR').strip(),
            'url': (offer.findtext('url', '') or '').strip(),
            'description': (offer.findtext('description', '') or '').strip(),
            'pictures': pictures,
            'params': params,
            'video': video,
            'inStock': in_stock,
            'kind': _detect_kind(name, raw_params),
            'mobility': _mobility(name, raw_params),
            'sort': order,
        })

    present = []
    for b in BRAND_ORDER:
        if any(p['brand'] == b for p in products):
            present.append(b)
    for p in products:
        if p['brand'] not in present:
            present.append(p['brand'])

    return {'products': products, 'brands': present, 'count': len(products)}


def handler(event: dict, context: Any) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    try:
        now_utc = datetime.now(timezone.utc)
        qs = event.get('queryStringParameters') or {}
        force_refresh = str(qs.get('refresh', '')).lower() in ('1', 'true', 'yes')

        cache_valid = (
            _CACHE['payload'] is not None
            and _CACHE['next_update'] is not None
            and now_utc < _CACHE['next_update']
            and not force_refresh
        )

        if not cache_valid:
            data = _fetch_and_parse()
            _CACHE['updated_at'] = now_utc
            _CACHE['next_update'] = _next_refresh_after(now_utc)
            data['updatedAt'] = _CACHE['updated_at'].isoformat()
            data['nextUpdate'] = _CACHE['next_update'].isoformat()
            _CACHE['payload'] = json.dumps(data, ensure_ascii=False)

        max_age = max(60, int((_CACHE['next_update'] - now_utc).total_seconds()))

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': f'public, max-age={max_age}',
            },
            'isBase64Encoded': False,
            'body': _CACHE['payload'],
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'{type(e).__name__}: {e}'}, ensure_ascii=False),
        }