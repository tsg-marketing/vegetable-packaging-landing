"""Business: Анализ фида каталога — подсчёт товаров с видео и фильтрация по rutube/youtube."""
import json
import urllib.request


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    url = 'https://functions.poehali.dev/981263b7-3a88-449e-abf8-f61fbd2b5289'
    req = urllib.request.Request(url, headers={'User-Agent': 'feed-check/1.0'})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode('utf-8'))

    products = data.get('products', [])
    total = len(products)
    with_video = 0
    with_http = 0
    rutube = 0
    youtube = 0
    samples = []
    category_counts: dict = {}
    cat290_examples: list = []

    for p in products:
        cid = str(p.get('categoryId') or '')
        category_counts[cid] = category_counts.get(cid, 0) + 1
        if cid == '290' and len(cat290_examples) < 5:
            cat290_examples.append(p.get('name'))
        params = p.get('params', []) or []
        video_param = None
        for pr in params:
            n = (pr.get('name') or '').strip().lower()
            if 'видео' in n:
                video_param = pr
                break
        if not video_param:
            continue
        with_video += 1
        val = (video_param.get('value') or '').strip()
        if val.startswith('http'):
            with_http += 1
            low = val.lower()
            if 'rutube.ru' in low:
                rutube += 1
            if 'youtube.com' in low or 'youtu.be' in low:
                youtube += 1
            if len(samples) < 15:
                samples.append({'name': p.get('name'), 'url': val})

    return {
        'statusCode': 200,
        'headers': {**cors(), 'Content-Type': 'application/json'},
        'body': json.dumps({
            'total_products': total,
            'with_video_param': with_video,
            'with_http_url': with_http,
            'rutube_count': rutube,
            'youtube_count': youtube,
            'samples': samples,
            'category_counts': category_counts,
            'cat290_examples': cat290_examples,
        }, ensure_ascii=False),
    }


def cors() -> dict:
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }