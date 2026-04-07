import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGO_HOST = os.getenv("MONGO_HOST", "localhost")
MONGO_PORT = os.getenv("MONGO_PORT", "27017")
MONGO_DB = os.getenv("MONGO_DB", "agrihub")
MONGO_URI = f"mongodb://{MONGO_HOST}:{MONGO_PORT}/"

# CSV Path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "crop_production.csv")
BACKUP_CSV = os.getenv("BACKUP_CSV_PATH", r"C:\Users\sandep\Downloads\archive (1)\India Agriculture Crop Production.csv")

def clean_data(df):
    """Clean data for MongoDB insertion."""
    # Clean column names
    df.columns = [c.strip() for c in df.columns]

    # Map column names if they are different
    column_mapping = {
        "State_Name": "state",
        "District_Name": "district",
        "Crop_Year": "year",
        "Season": "season",
        "Crop": "crop",
        "Area": "area",
        "Production": "production",
        "Yield": "yield"
    }

    # Find which of these exist in the df
    actual_cols = {}
    for target, source in column_mapping.items():
        if source in df.columns:
            actual_cols[source] = target

    if not actual_cols:
        return df

    df = df.rename(columns=actual_cols)

    # Convert numeric fields
    numeric_cols = ["Production", "Area", "Yield"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)  # type: ignore

    # Ensure year is a string
    if "Year" in df.columns:
        df["Year"] = df["Year"].astype(str)

    return df

def import_csv():
    """Import CSV data into MongoDB."""
    print(f"Loading CSV from {CSV_PATH}...")
    if os.path.exists(CSV_PATH):
        df = pd.read_csv(CSV_PATH)
    elif os.path.exists(BACKUP_CSV):
        print(f"Using backup CSV at {BACKUP_CSV}...")
        df = pd.read_csv(BACKUP_CSV)
    else:
        print("CSV file not found.")
        return

    print("Cleaning data...")
    df_clean = clean_data(df)

    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    collection = db["crop_production"]

    # Delete existing data (to ensure fresh start as requested)
    collection.delete_many({})

    # Convert dataframe to dictionary records
    records = df_clean.to_dict(orient="records")

    print(f"Inserting {len(records)} records into MongoDB...")
    # Insert in chunks if it's too large
    chunk_size = 50000
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        collection.insert_many(chunk)
        print(f"Inserted {i + len(chunk)} records...")

    print("Successfully imported data to MongoDB!")
    client.close()

if __name__ == "__main__":
    import_csv()
