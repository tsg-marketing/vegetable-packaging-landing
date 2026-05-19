"""
Business: Загружает YML-фид t-sib.ru, отдаёт товары category 405 с фото/параметрами/описанием.
Кэш: данные обновляются один раз в сутки в 12:00 по Новосибирску (UTC+7).
Args: event с httpMethod (GET/OPTIONS); context — объект с request_id.
Returns: JSON {products: [...], updatedAt, nextUpdate} с фото, параметрами и описанием.
"""
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from typing import Any

FEED_URL = "https://t-sib.ru/upload/catalog.xml"
TARGET_CATEGORY = "405"

# Новосибирское время (UTC+7) — обновление в 12:00 local
NSK_TZ = timezone(timedelta(hours=7))
REFRESH_HOUR_NSK = 12

# In-memory cache between warm invocations
_CACHE: dict = {
    'payload': None,        # сериализованный JSON-body
    'updated_at': None,     # datetime (UTC)
    'next_update': None,    # datetime (UTC)
}


def _next_refresh_after(now_utc: datetime) -> datetime:
    """Ближайший момент в UTC, когда в Новосибирске 12:00."""
    now_nsk = now_utc.astimezone(NSK_TZ)
    target_nsk = now_nsk.replace(hour=REFRESH_HOUR_NSK, minute=0, second=0, microsecond=0)
    if now_nsk >= target_nsk:
        target_nsk = target_nsk + timedelta(days=1)
    return target_nsk.astimezone(timezone.utc)


def _fetch_and_parse() -> dict:
    req = urllib.request.Request(FEED_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=25) as resp:
        xml_data = resp.read()

    root = ET.fromstring(xml_data)
    shop = root.find('shop')
    if shop is None:
        raise RuntimeError('No shop element in feed')

    offers_el = shop.find('offers')
    if offers_el is None:
        raise RuntimeError('No offers element in feed')

    products = []
    for offer in offers_el.findall('offer'):
        cat = offer.findtext('categoryId', '').strip()
        if cat != TARGET_CATEGORY:
            continue

        pictures = [p.text.strip() for p in offer.findall('picture') if p.text]

        params = []
        for prm in offer.findall('param'):
            pname = (prm.get('name') or '').strip()
            pval = (prm.text or '').strip()
            if not pname or not pval:
                continue
            if pname.upper() == 'GUID':
                continue
            params.append({'name': pname, 'value': pval})

        description = (offer.findtext('description', '') or '').strip()

        price_raw = offer.findtext('price', '').strip()
        try:
            price_num = float(price_raw) if price_raw else 0
        except ValueError:
            price_num = 0

        products.append({
            'id': offer.get('id', ''),
            'name': offer.findtext('name', '').strip(),
            'vendor': offer.findtext('vendor', '').strip(),
            'price': price_num,
            'priceText': price_raw,
            'currency': offer.findtext('currencyId', 'RUR').strip(),
            'url': offer.findtext('url', '').strip(),
            'description': description,
            'pictures': pictures,
            'params': params,
        })

    return {'products': products, 'count': len(products)}


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

        params = event.get('queryStringParameters') or {}
        force_refresh = str(params.get('refresh', '')).lower() in ('1', 'true', 'yes')

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
            data['updatedAtNsk'] = _CACHE['updated_at'].astimezone(NSK_TZ).strftime('%Y-%m-%d %H:%M:%S')
            data['nextUpdateNsk'] = _CACHE['next_update'].astimezone(NSK_TZ).strftime('%Y-%m-%d %H:%M:%S')
            _CACHE['payload'] = json.dumps(data, ensure_ascii=False)

        # max-age до следующего обновления (в секундах)
        max_age = max(60, int((_CACHE['next_update'] - now_utc).total_seconds()))

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': f'public, max-age={max_age}',
                'X-Cache-Updated': _CACHE['updated_at'].isoformat(),
                'X-Cache-Next-Update': _CACHE['next_update'].isoformat(),
            },
            'isBase64Encoded': False,
            'body': _CACHE['payload'],
        }
    except Exception as e:
        return _error(f'{type(e).__name__}: {e}')


def _error(msg: str) -> dict:
    return {
        'statusCode': 500,
        'headers': {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': msg}, ensure_ascii=False),
    }
