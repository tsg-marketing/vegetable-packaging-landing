"""
Business: Временная функция для скачивания ZIP-архива по URL, распаковки в S3 (CDN)
и чтения отдельных файлов из S3 кусками (для обхода лимитов WebFetch).
Args: event с httpMethod, queryStringParameters {url, prefix, list_only, read_key, offset, limit}
Returns: JSON со списком файлов / либо сырое содержимое одного файла (кусок)
"""
import json
import os
import io
import zipfile
import urllib.request
import boto3


def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    params = event.get('queryStringParameters') or {}
    zip_url = params.get('url', '')
    prefix = params.get('prefix', 'import')
    list_only = params.get('list_only', '') == '1'
    read_key = params.get('read_key', '')

    if read_key:
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        obj = s3.get_object(Bucket='files', Key=read_key)
        body = obj['Body'].read().decode('utf-8', errors='replace')
        total = len(body)
        offset = int(params.get('offset', '0'))
        limit = int(params.get('limit', '0'))
        if limit > 0:
            chunk = body[offset:offset + limit]
        elif offset > 0:
            chunk = body[offset:]
        else:
            chunk = body
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json; charset=utf-8',
                'X-Total-Size': str(total),
            },
            'body': json.dumps({
                'total': total,
                'offset': offset,
                'length': len(chunk),
                'eof': offset + len(chunk) >= total,
                'content': chunk,
            }, ensure_ascii=False),
        }

    if not zip_url:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'url query param is required'}),
        }

    req = urllib.request.Request(zip_url, headers={'User-Agent': 'poehali-import/1.0'})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

    uploaded = []
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        names = zf.namelist()
        if list_only:
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'files': names, 'count': len(names)}),
            }
        for name in names:
            if name.endswith('/'):
                continue
            content = zf.read(name)
            key = f"{prefix}/{name}"
            content_type = 'application/octet-stream'
            if name.endswith('.tsx') or name.endswith('.ts') or name.endswith('.js') or name.endswith('.jsx'):
                content_type = 'text/plain; charset=utf-8'
            elif name.endswith('.json'):
                content_type = 'application/json'
            elif name.endswith('.css'):
                content_type = 'text/css'
            elif name.endswith('.html'):
                content_type = 'text/html'
            elif name.endswith('.md'):
                content_type = 'text/markdown'
            s3.put_object(Bucket='files', Key=key, Body=content, ContentType=content_type)
            uploaded.append({
                'name': name,
                'size': len(content),
                'url': f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}",
            })

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'count': len(uploaded), 'files': uploaded}, ensure_ascii=False),
    }
