from database_mongo import db

def create_new_tables():
    # List of collections needed for the current MongoDB backend
    tables_to_create = [
        "users",
        "crop_production",
        "weather_data",
        "farm_equipments",
        "quotes",
        "land_data",
        "market_prices",
        "soil_health"
    ]

    print("Checking and creating explicit MongoDB collections...")
    
    # Get a list of existing collections
    existing_collections = db.list_collection_names()
    
    for table in tables_to_create:
        if table not in existing_collections:
            try:
                db.create_collection(table)
                print(f"Created new table: '{table}'")
            except Exception as e:
                print(f"Failed to create table '{table}': {e}")
        else:
            print(f"Table '{table}' already exists.")

if __name__ == "__main__":
    create_new_tables()
    print("Finished checking tables.")
