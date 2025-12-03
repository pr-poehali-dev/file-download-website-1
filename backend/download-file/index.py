import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Track file download and increment counter
    Args: event - dict with httpMethod, queryStringParameters, headers
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
    file_id = body_data.get('fileId')
    user_id = event.get('headers', {}).get('X-User-Id', 'Гость')
    
    if not file_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'fileId is required'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE files 
        SET downloads_count = downloads_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING downloads_count
    """, (file_id,))
    
    result = cur.fetchone()
    
    if result:
        cur.execute("""
            INSERT INTO download_history (file_id, user_id)
            VALUES (%s, %s)
        """, (file_id, user_id))
        
        conn.commit()
        downloads = result[0]
    else:
        downloads = 0
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'downloads': downloads
        }),
        'isBase64Encoded': False
    }
