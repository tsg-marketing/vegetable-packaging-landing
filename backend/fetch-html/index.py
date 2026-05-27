"""
Business: Тех-функция, загружает HTML страницы по URL и отдаёт куском (offset/limit) для разбора лендинга.
Args: event с queryStringParameters {url, offset, limit}
Returns: JSON {total, offset, length, eof, content}
"""
import json
import ssl
import urllib.request
from typing import Any


def handler(event: dict, context: Any) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': '',
        }

    params = event.get('queryStringParameters') or {}
    url = params.get('url', '')
    if not url:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'url required'}),
        }

    offset = int(params.get('offset', '0'))
    limit = int(params.get('limit', '0'))

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; poehali-fetch/1.0)'})
    with urllib.request.urlopen(req, timeout=25, context=ctx) as resp:
        raw = resp.read()
    try:
        body = raw.decode('utf-8')
    except UnicodeDecodeError:
        body = raw.decode('cp1251', errors='replace')

    total = len(body)
    if limit > 0:
        chunk = body[offset:offset + limit]
    else:
        chunk = body[offset:]

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json; charset=utf-8',
        },
        'body': json.dumps({
            'total': total,
            'offset': offset,
            'length': len(chunk),
            'eof': offset + len(chunk) >= total,
            'content': chunk,
        }, ensure_ascii=False),
    }
