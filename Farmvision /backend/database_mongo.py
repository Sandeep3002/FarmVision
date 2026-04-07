import os
from pymongo import MongoClient
from dotenv import load_dotenv
from typing import Any, List, Dict, Optional

load_dotenv()

MONGO_HOST = str(os.getenv("MONGO_HOST", "localhost"))
MONGO_PORT = str(os.getenv("MONGO_PORT", "27017"))
MONGO_DB = str(os.getenv("MONGO_DB", "agrihub"))
MONGO_URI = f"mongodb://{MONGO_HOST}:{MONGO_PORT}/"

client: Any = MongoClient(MONGO_URI)
db = client[MONGO_DB]

def get_mongo_db():
    return db

def format_mongo_doc(doc):
    """Convert MongoDB document to a format suitable for API (handle _id)."""
    if not doc:
        return None
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        # Avoid removing it if the frontend expects it, but usually standard 
        # to have 'id' instead of '_id' for JSON responses.
    return doc

def find_documents(collection_name: str, query: Dict = {}, sort: Optional[List] = None, limit: int = 100) -> List[Dict]:
    """Helper to find multiple documents."""
    coll = db[collection_name]
    cursor = coll.find(query)
    if sort:
        cursor = cursor.sort(sort)
    if limit:
        cursor = cursor.limit(limit)
    
    return [format_mongo_doc(d) for d in cursor]

def aggregate_documents(collection_name: str, pipeline: List[Dict]) -> List[Dict]:
    """Helper for MongoDB aggregation pipelines."""
    coll = db[collection_name]
    return list(coll.aggregate(pipeline))
