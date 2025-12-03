import json
import os
import psycopg2
from typing import Dict, Any
import base64
import uuid
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Upload file and save to database
    Args: event - dict with httpMethod, body, headers
          context - object with attributes: request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    file_name = body_data.get('name', 'untitled')
    file_size = body_data.get('size', 0)
    mime_type = body_data.get('type', 'application/octet-stream')
    category = body_data.get('category', 'Другое')
    uploaded_by = event.get('headers', {}).get('X-User-Id', 'Гость')
    file_content = body_data.get('content', '')
    
    file_id = str(uuid.uuid4())
    file_url = f"data:{mime_type};base64,{file_content[:100]}"
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO files (name, original_name, size_bytes, mime_type, category, file_url, uploaded_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, created_at
    """, (file_id, file_name, file_size, mime_type, category, file_url, uploaded_by))
    
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'id': result[0],
            'name': file_name,
            'size': file_size,
            'category': category,
            'uploadedBy': uploaded_by,
            'createdAt': result[1].isoformat()
        }),
        'isBase64Encoded': False
    }
