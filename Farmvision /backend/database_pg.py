import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "Dad_mom24")
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = os.getenv("PG_PORT", "5432")
PG_DB = os.getenv("PG_DB", "agriculture")

def get_pg_connection():
    try:
        conn = psycopg2.connect(
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT,
            database=PG_DB
        )
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return None

def execute_query(query, params=None):
    conn = get_pg_connection()
    if not conn:
        return None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(query, params)
        rows = cur.fetchall()
        # Convert RealDictRow to plain dict, Decimal to float, and handle NaN
        from decimal import Decimal
        import math
        result = []
        for row in rows:
            clean_row = {}
            for k, v in dict(row).items():
                if isinstance(v, Decimal):
                    fv = float(v)
                    clean_row[k] = 0 if (math.isnan(fv) or math.isinf(fv)) else fv
                elif isinstance(v, float):
                    clean_row[k] = 0 if (math.isnan(v) or math.isinf(v)) else v
                else:
                    clean_row[k] = v
            result.append(clean_row)
        cur.close()
        conn.close()
        return result
    except Exception as e:
        print(f"Query Error: {e}")
        if conn:
            conn.close()
        return None
