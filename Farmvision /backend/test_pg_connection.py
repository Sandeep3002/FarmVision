import psycopg2
from psycopg2 import sql

def check_postgres():
    try:
        # First connect to the default 'postgres' database to check if 'agriculture' exists
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="postgres",
            user="postgres",
            password="Dad_mom24"
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        print("✅ Successfully connected to PostgreSQL server!")

        # Check if agriculture database exists
        cur.execute("SELECT datname FROM pg_database;")
        databases = [row[0] for row in cur.fetchall()]
        
        if "agriculture" not in databases:
            print("⚠️ Database 'agriculture' does not exist. Creating it now...")
            cur.execute("CREATE DATABASE agriculture;")
            print("✅ Database 'agriculture' created successfully.")
        else:
            print("✅ Database 'agriculture' already exists.")
            
        cur.close()
        conn.close()

        # Reconnect to 'agriculture' and list tables
        conn_agri = psycopg2.connect(
            host="localhost",
            port="5432",
            database="agriculture",
            user="postgres",
            password="Dad_mom24"
        )
        cur_agri = conn_agri.cursor()
        cur_agri.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = [row[0] for row in cur_agri.fetchall()]
        
        print("\n--- Tables in 'agriculture' ---")
        if not tables:
            print("No tables found. The database is empty.")
        else:
            for t in tables:
                print(f"- {t}")

        cur_agri.close()
        conn_agri.close()

    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")

if __name__ == "__main__":
    check_postgres()
