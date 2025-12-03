import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get all files from database with optional filters
    Args: event - dict with httpMethod, queryStringParameters
          context - object with attributes: request_id, function_name
    Returns: HTTP response dict with files list
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {}) or {}
    category = params.get('category', '')
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    if category and category != 'Все':
        cur.execute("""
            SELECT id, name, original_name, size_bytes, mime_type, category, 
                   uploaded_by, downloads_count, created_at
            FROM files
            WHERE category = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (category,))
    else:
        cur.execute("""
            SELECT id, name, original_name, size_bytes, mime_type, category, 
                   uploaded_by, downloads_count, created_at
            FROM files
            ORDER BY created_at DESC
            LIMIT 50
        """)
    
    files = []
    for row in cur.fetchall():
        files.append({
            'id': str(row[0]),
            'name': row[2],
            'size': format_size(row[3]),
            'type': get_file_type(row[4]),
            'category': row[5],
            'uploadedBy': row[6],
            'downloads': row[7],
            'uploadedDate': format_date(row[8])
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'files': files}),
        'isBase64Encoded': False
    }

def format_size(bytes_size: int) -> str:
    if bytes_size < 1024:
        return f"{bytes_size} B"
    elif bytes_size < 1024 * 1024:
        return f"{bytes_size / 1024:.1f} KB"
    elif bytes_size < 1024 * 1024 * 1024:
        return f"{bytes_size / (1024 * 1024):.1f} MB"
    else:
        return f"{bytes_size / (1024 * 1024 * 1024):.1f} GB"

def get_file_type(mime_type: str) -> str:
    if 'pdf' in mime_type:
        return 'pdf'
    elif 'zip' in mime_type or 'archive' in mime_type:
        return 'zip'
    elif 'video' in mime_type:
        return 'video'
    elif 'excel' in mime_type or 'spreadsheet' in mime_type:
        return 'excel'
    elif 'image' in mime_type:
        return 'image'
    else:
        return 'file'

def format_date(date_obj) -> str:
    from datetime import datetime, timedelta
    now = datetime.now()
    diff = now - date_obj
    
    if diff.days == 0:
        return 'Сегодня'
    elif diff.days == 1:
        return 'Вчера'
    elif diff.days < 7:
        return f'{diff.days} дн. назад'
    elif diff.days < 30:
        weeks = diff.days // 7
        return f'{weeks} нед. назад'
    else:
        return date_obj.strftime('%d.%m.%Y')
