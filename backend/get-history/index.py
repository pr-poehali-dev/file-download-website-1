import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get download history for a user
    Args: event - dict with httpMethod, headers
          context - object with attributes: request_id, function_name
    Returns: HTTP response dict with download history
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
    
    user_id = event.get('headers', {}).get('X-User-Id', 'Гость')
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    cur.execute("""
        SELECT f.id, f.original_name, dh.downloaded_at
        FROM download_history dh
        JOIN files f ON dh.file_id = f.id
        WHERE dh.user_id = %s
        ORDER BY dh.downloaded_at DESC
        LIMIT 20
    """, (user_id,))
    
    history = []
    for row in cur.fetchall():
        history.append({
            'id': str(row[0]),
            'fileName': row[1],
            'date': format_datetime(row[2])
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'history': history}),
        'isBase64Encoded': False
    }

def format_datetime(date_obj) -> str:
    from datetime import datetime
    now = datetime.now()
    diff = now - date_obj
    
    if diff.days == 0:
        if diff.seconds < 3600:
            minutes = diff.seconds // 60
            return f'Сегодня, {minutes} мин. назад'
        else:
            return f'Сегодня, {date_obj.strftime("%H:%M")}'
    elif diff.days == 1:
        return f'Вчера, {date_obj.strftime("%H:%M")}'
    else:
        return date_obj.strftime('%d %B, %H:%M')
