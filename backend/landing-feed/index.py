"""
Business: XML-фид (YML) товаров всех лендингов pack.t-sib.ru с ссылками вида /slug#Anchor.
Args: event с httpMethod (GET/OPTIONS), queryStringParameters (refresh=1); context — объект с request_id.
Returns: XML-документ формата Яндекс.Маркет (yml_catalog) со всеми товарами лендингов.
"""
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from typing import Any
from xml.sax.saxutils import escape

FEED_URL = "https://t-sib.ru/upload/catalog.xml"
SITE = "https://pack.t-sib.ru"
CACHE_TTL_SECONDS = 600

PAGES = [
    {"slug": "/vegetables", "name": "Упаковка овощей и фруктов", "categories": {"405"}},
    {"slug": "/vacuum", "name": "Вакуум-упаковочное оборудование",
     "categories": {"290", "291", "292", "293", "294", "444", "477", "478", "480", "481", "482", "510"}},
    {"slug": "/termousadka", "name": "Термоусадочное оборудование",
     "categories": {"340", "295", "345", "341", "342", "343", "344", "354", "357", "353", "355"}},
    {"slug": "/traysealers", "name": "Запайщики лотков (трейсилеры)",
     "categories": {"307", "308", "309", "310", "498", "499"}},
    {"slug": "/kartonajnoe", "name": "Картонажное оборудование", "categories": {"559", "558", "325"}},
    {"slug": "/gorizontalnoe", "name": "Горизонтальные машины flow-pack", "categories": {"306"}},
    {"slug": "/obanderolivanie", "name": "Обандероливающие машины", "categories": {"331"}},
]

BANDALL_RE = re.compile(r"band\s*['\u2019]?\s*all", re.IGNORECASE)

TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
}

_CACHE: dict = {'xml': None, 'updated_at': None, 'expires_at': None}


def product_anchor(name: str) -> str:
    out = []
    upper = True
    for ch in (name or '').strip():
        low = ch.lower()
        if low in TRANSLIT:
            t = TRANSLIT[low]
            out.append(t.capitalize() if upper and t else t)
            upper = False
        elif ch.isascii() and ch.isalnum():
            out.append(ch)
            upper = False
        elif ch in '-_.':
            out.append('-')
            upper = False
        else:
            upper = True
    res = re.sub(r'-{2,}', '-', ''.join(out)).strip('-')
    return res or 'product'


def _clean_html(text: str) -> str:
    text = re.sub(r'<[^>]+>', ' ', text or '')
    text = text.replace('&nbsp;', ' ')
    return re.sub(r'\s+', ' ', text).strip()


def _fetch_offers() -> list:
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
    return list(offers_el.findall('offer'))


def _build_xml(slug_filter: str = '') -> str:
    offers = _fetch_offers()
    now = datetime.now(timezone(timedelta(hours=7)))

    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<yml_catalog date="{now.strftime("%Y-%m-%d %H:%M")}">',
        '<shop>',
        '<name>Техносиб — упаковочное оборудование</name>',
        '<company>Техносиб</company>',
        f'<url>{SITE}/</url>',
        '<currencies><currency id="RUR" rate="1"/></currencies>',
        '<categories>',
    ]

    for i, page in enumerate(PAGES, start=1):
        parts.append(f'<category id="{i}">{escape(page["name"])}</category>')
    parts.append('</categories>')
    parts.append('<offers>')

    total = 0
    used_global = set()

    for i, page in enumerate(PAGES, start=1):
        if slug_filter and page['slug'] != slug_filter:
            continue
        used = set()
        for offer in offers:
            cat = (offer.findtext('categoryId', '') or '').strip()
            if cat not in page['categories']:
                continue
            name = (offer.findtext('name', '') or '').strip()
            if not name:
                continue
            if page['slug'] == '/obanderolivanie' and BANDALL_RE.search(name):
                continue

            base = product_anchor(name)
            anchor = base
            n = 2
            while anchor.lower() in used:
                anchor = f'{base}-{n}'
                n += 1
            used.add(anchor.lower())

            offer_id = f'{i}-{offer.get("id", str(total))}'
            if offer_id in used_global:
                continue
            used_global.add(offer_id)

            url = f'{SITE}{page["slug"]}#{anchor}'
            pictures = [p.text.strip() for p in offer.findall('picture') if p.text][:5]
            price_raw = (offer.findtext('price', '') or '').strip()
            try:
                price = int(float(price_raw)) if price_raw else 0
            except ValueError:
                price = 0
            vendor = (offer.findtext('vendor', '') or '').strip()
            description = _clean_html(offer.findtext('description', '') or '')[:600]

            parts.append(f'<offer id="{escape(offer_id)}" available="true">')
            parts.append(f'<name>{escape(name)}</name>')
            parts.append(f'<url>{escape(url)}</url>')
            if price > 0:
                parts.append(f'<price>{price}</price>')
            parts.append('<currencyId>RUR</currencyId>')
            parts.append(f'<categoryId>{i}</categoryId>')
            for pic in pictures:
                parts.append(f'<picture>{escape(pic)}</picture>')
            if vendor:
                parts.append(f'<vendor>{escape(vendor)}</vendor>')
            if description:
                parts.append(f'<description>{escape(description)}</description>')
            for prm in offer.findall('param'):
                pname = (prm.get('name') or '').strip()
                pval = (prm.text or '').strip()
                if not pname or not pval or pname.upper() == 'GUID':
                    continue
                parts.append(f'<param name="{escape(pname)}">{escape(pval)}</param>')
            parts.append('</offer>')
            total += 1

    parts.append('</offers>')
    parts.append('</shop>')
    parts.append('</yml_catalog>')
    return '\n'.join(parts)


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
        now = datetime.now(timezone.utc)
        params = event.get('queryStringParameters') or {}
        force = str(params.get('refresh', '')).lower() in ('1', 'true', 'yes')

        slug = str(params.get('page', '') or '').strip()
        if slug and not slug.startswith('/'):
            slug = '/' + slug
        if slug:
            xml = _build_xml(slug)
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/xml; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': f'public, max-age={CACHE_TTL_SECONDS}',
                },
                'isBase64Encoded': False,
                'body': xml,
            }

        fresh = (
            _CACHE['xml'] is not None
            and _CACHE['expires_at'] is not None
            and now < _CACHE['expires_at']
            and not force
        )
        if not fresh:
            _CACHE['xml'] = _build_xml()
            _CACHE['updated_at'] = now
            _CACHE['expires_at'] = now + timedelta(seconds=CACHE_TTL_SECONDS)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/xml; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': f'public, max-age={CACHE_TTL_SECONDS}',
            },
            'isBase64Encoded': False,
            'body': _CACHE['xml'],
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
