"""
Business: Загружает YML-фид t-sib.ru, группирует товары по заданным категориям (290, 296, 306, 307, 311, 325, 332, 336, 340, 345, 415 и все категории с parentId=350). Для каждой группы возвращает топ-10 самых дешёвых товаров.
Args: event с httpMethod (GET/OPTIONS); context — объект с request_id.
Returns: JSON {groups: [{id, name, products: [...]}], updatedAt} — каждая группа с заголовком и до 10 товаров.
"""
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from typing import Any

FEED_URL = "https://t-sib.ru/upload/catalog.xml"

# Явный список целевых категорий из ТЗ
EXPLICIT_CATEGORY_IDS = {"290", "296", "306", "307", "311", "325", "332", "336", "340", "345", "415"}
# Все категории с parentId=350 добавляются динамически
PARENT_350 = "350"
TOP_N = 10

NSK_TZ = timezone(timedelta(hours=7))
REFRESH_HOUR_NSK = 12

_CACHE: dict = {
    'payload': None,
    'updated_at': None,
    'next_update': None,
}


def _next_refresh_after(now_utc: datetime) -> datetime:
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

    # Собираем словарь категорий
    categories_el = shop.find('categories')
    if categories_el is None:
        raise RuntimeError('No categories element in feed')

    cat_name: dict = {}
    cat_parent: dict = {}
    cat_order: list = []
    for c in categories_el.findall('category'):
        cid = c.get('id', '').strip()
        if not cid:
            continue
        cat_name[cid] = (c.text or '').strip()
        cat_parent[cid] = (c.get('parentId') or '').strip()
        cat_order.append(cid)

    # Итоговый набор целевых категорий: явные + дети 350
    target_ids = set(EXPLICIT_CATEGORY_IDS)
    for cid, pid in cat_parent.items():
        if pid == PARENT_350:
            target_ids.add(cid)

    # Парсим товары
    offers_el = shop.find('offers')
    if offers_el is None:
        raise RuntimeError('No offers element in feed')

    groups_map: dict = {cid: [] for cid in target_ids}

    for offer in offers_el.findall('offer'):
        cat = offer.findtext('categoryId', '').strip()
        if cat not in target_ids:
            continue

        pictures = [p.text.strip() for p in offer.findall('picture') if p.text]

        price_raw = offer.findtext('price', '').strip()
        try:
            price_num = float(price_raw) if price_raw else 0
        except ValueError:
            price_num = 0

        groups_map[cat].append({
            'id': offer.get('id', ''),
            'name': offer.findtext('name', '').strip(),
            'vendor': offer.findtext('vendor', '').strip(),
            'price': price_num,
            'priceText': price_raw,
            'currency': offer.findtext('currencyId', 'RUR').strip(),
            'url': offer.findtext('url', '').strip(),
            'pictures': pictures,
        })

    # Сортируем каждую группу: сначала с ценой > 0 (по возрастанию), потом без цены
    groups = []
    for cid in cat_order:
        if cid not in target_ids:
            continue
        items = groups_map.get(cid, [])
        if not items:
            continue
        priced = sorted([p for p in items if p['price'] > 0], key=lambda x: x['price'])
        unpriced = [p for p in items if p['price'] <= 0]
        top = (priced + unpriced)[:TOP_N]
        groups.append({
            'id': cid,
            'name': cat_name.get(cid, f'Категория {cid}'),
            'total': len(items),
            'products': top,
        })

    return {'groups': groups, 'count': len(groups)}


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
