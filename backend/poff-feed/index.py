"""
Business: YML-фид (Яндекс.Маркет) по товарам страницы «Плёнка ПОФ термоусадочная».
Args: event с httpMethod (GET/OPTIONS); context — объект с request_id.
Returns: XML-документ yml_catalog с рулонами плёнки ПОФ и ссылками на якоря страницы /poff_plenka.
"""
import json
from datetime import datetime, timedelta, timezone
from typing import Any
from xml.sax.saxutils import escape

SITE = "https://pack.t-sib.ru"
PAGE = "/poff_plenka"
CDN = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/"

ROWS = [
    {"width": "200/400", "length": 1000, "thickness": 12.5, "price": 1196, "img": "8c262bf9-7c5f-479d-96f1-62379bd319b7.jpg"},
    {"width": "300/600", "length": 1000, "thickness": 12.5, "price": 1794, "img": "e4414bb7-33ae-4642-92a3-636befa4fb23.jpg"},
    {"width": "300/600", "length": 1250, "thickness": 15, "price": 2691, "img": "2c5953bc-83f1-4873-9fe0-342cf6dfe5b3.jpg"},
    {"width": "300/600", "length": 1000, "thickness": 19, "price": 2727.4, "img": "8f502018-e704-4c36-a648-44ede59eeec3.jpg"},
    {"width": "350/700", "length": 750, "thickness": 15, "price": 1885, "img": "43bc99bb-08da-45c4-9c6b-36ec76a85660.jpg"},
    {"width": "400/800", "length": 1250, "thickness": 15, "price": 3588, "img": "2b435c4d-bba3-46a0-997d-7cb2c9244190.jpg"},
    {"width": "450/900", "length": 1000, "thickness": 19, "price": 4089.8, "img": "b1bde5f1-5646-444e-b173-e527e555ed3d.jpg"},
    {"width": "550/1100", "length": 1000, "thickness": 19, "price": 4999.8, "img": "bb489f1b-7783-4532-98dd-b8e1a8c0b765.jpg"},
]

VENDOR = "Техно-Сиб"


def _fmt_num(value: float) -> str:
    return str(int(value)) if float(value) == int(value) else str(value)


def _build_xml() -> str:
    now = datetime.now(timezone(timedelta(hours=7)))
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<yml_catalog date="{now.strftime("%Y-%m-%d %H:%M")}">',
        '<shop>',
        '<name>Техно-Сиб — упаковочное оборудование</name>',
        '<company>Техно-Сиб</company>',
        f'<url>{SITE}{PAGE}</url>',
        '<currencies><currency id="RUR" rate="1"/></currencies>',
        '<categories><category id="1">Плёнка ПОФ термоусадочная</category></categories>',
        '<offers>',
    ]

    for i, r in enumerate(ROWS, start=1):
        thickness = _fmt_num(r["thickness"])
        name = f'Плёнка ПОФ {r["width"]} мм × {r["length"]} м × {thickness} мкм'
        url = f'{SITE}{PAGE}#product-poff-{i}'
        price = r["price"]
        price_str = str(int(price)) if float(price) == int(price) else f'{price:.2f}'
        description = (
            f'Термоусадочная полиолефиновая плёнка (ПОФ) в рулоне. Ширина полурукава {r["width"]} мм, '
            f'намотка {r["length"]} м, толщина {thickness} мкм. Без хлора и запаха, прозрачная и глянцевая. '
            f'Подходит для упаковки пищевой и непищевой продукции на ручных, полуавтоматических '
            f'и автоматических термоупаковочных аппаратах. Цена указана за рулон, отгрузка со склада.'
        )

        parts.append(f'<offer id="poff-{i}" available="true">')
        parts.append(f'<name>{escape(name)}</name>')
        parts.append(f'<url>{escape(url)}</url>')
        parts.append(f'<price>{price_str}</price>')
        parts.append('<currencyId>RUR</currencyId>')
        parts.append('<categoryId>1</categoryId>')
        parts.append(f'<picture>{escape(CDN + r["img"])}</picture>')
        parts.append(f'<vendor>{escape(VENDOR)}</vendor>')
        parts.append(f'<description>{escape(description)}</description>')
        parts.append('<sales_notes>Отгрузка со склада, минимальный заказ — 1 рулон</sales_notes>')
        parts.append(f'<param name="Ширина">{r["width"]} мм</param>')
        parts.append(f'<param name="Намотка">{r["length"]} м</param>')
        parts.append(f'<param name="Толщина">{thickness} мкм</param>')
        parts.append('<param name="Тип плёнки">Полиолефиновая (ПОФ)</param>')
        parts.append('</offer>')

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
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/xml; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600',
            },
            'isBase64Encoded': False,
            'body': _build_xml(),
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
