import psycopg2
def create_pg_tables():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="agriculture",
            user="postgres",
            password="Dad_mom24"
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        print("⚡ Connected! Creating tables rapidly...")

        # 1. users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                role VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✅ Created `users` table.")

        # 2. crops table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS crops (
                id SERIAL PRIMARY KEY,
                crop_name VARCHAR(100),
                season VARCHAR(50),
                estimated_yield FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✅ Created `crops` table.")

        # 3. weather_data table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS weather_data (
                id SERIAL PRIMARY KEY,
                location VARCHAR(100),
                temperature FLOAT,
                humidity FLOAT,
                date DATE
            );
        """)
        print("✅ Created `weather_data` table.")

        # 4. farm_equipments table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS farm_equipments (
                id SERIAL PRIMARY KEY,
                equipment_name VARCHAR(100),
                status VARCHAR(50),
                last_maintenance DATE
            );
        """)
        print("✅ Created `farm_equipments` table.")

        # List all tables to verify
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = [row[0] for row in cur.fetchall()]
        print(f"\n🎉 All active tables in database now: {', '.join(tables)}")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_pg_tables()
