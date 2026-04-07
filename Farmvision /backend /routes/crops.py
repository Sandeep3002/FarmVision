from fastapi import APIRouter, Request, Query, HTTPException
from typing import Optional, List
from database_mongo import db, format_mongo_doc
import re

router = APIRouter()

def serialize_mongo_cursor(cursor):
    """Auxiliary to format documents in list."""
    return [format_mongo_doc(d) for d in cursor]

@router.get("/crop-production")
def crop_production(limit: int = 100):
    try:
        coll = db["crop_production"]
        results = coll.find({}).limit(limit)
        return serialize_mongo_cursor(results)
    except Exception as e:
        return {"error": str(e)}

@router.get("/api/stats")
def get_stats():
    try:
        coll = db["crop_production"]
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_production": {"$sum": "$Production"},
                    "total_area": {"$sum": "$Area"},
                    "count": {"$sum": 1},
                    "num_crops": {"$addToSet": "$Crop"},
                    "num_states": {"$addToSet": "$State_Name"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "total_production": 1,
                    "total_area": 1,
                    "count": 1,
                    "num_crops": {"$size": "$num_crops"},
                    "num_states": {"$size": "$num_states"}
                }
            }
        ]
        stats = list(coll.aggregate(pipeline))
        
        if stats:
            res = stats[0]
            total_prod = res.get("total_production", 0) or 0
            total_area = res.get("total_area", 0) or 0
            avg_yield = float(total_prod) / float(total_area) if total_area > 0 else 0
            
            return {
                "total_production": total_prod,
                "total_area": total_area,
                "avg_yield": round(avg_yield, 2),
                "total_records": res.get("count", 0),
                "num_crops": res.get("num_crops", 0),
                "num_states": res.get("num_states", 0)
            }
        return {
            "total_production": 0, "total_area": 0, "avg_yield": 0,
            "total_records": 0, "num_crops": 0, "num_states": 0
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/api/seasonal")
def get_seasonal():
    try:
        coll = db["crop_production"]
        pipeline = [
            {"$group": {"_id": "$Season", "production": {"$sum": "$Production"}}},
            {"$project": {"_id": 0, "season": "$_id", "production": 1}}
        ]
        return list(coll.aggregate(pipeline))
    except Exception as e:
        return {"error": str(e)}

@router.get("/api/top-crops")
def get_top_crops():
    try:
        coll = db["crop_production"]
        pipeline = [
            {"$group": {"_id": "$Crop", "prod": {"$sum": "$Production"}}},
            {"$sort": {"prod": -1}},
            {"$limit": 5},
            {"$project": {"_id": 0, "name": "$_id", "prod": 1}}
        ]
        top = list(coll.aggregate(pipeline))
        
        if not top:
            return []
            
        max_prod = float(top[0]["prod"]) if top[0]["prod"] else 1
        colors = ["bg-emerald-500", "bg-lime-500", "bg-orange-500", "bg-yellow-500", "bg-amber-500"]
        icons = ["🌾", "🌿", "🌽", "🎋", "🌸"]
        
        for i, row in enumerate(top):
            row["pct"] = int((float(row["prod"] or 0) / max_prod) * 100)
            row["color"] = colors[i % len(colors)]
            row["icon"] = icons[i % len(icons)]
        return top
    except Exception as e:
        return {"error": str(e)}

@router.get("/api/trend")
def get_trend(state: Optional[str] = None, crop: Optional[str] = None):
    try:
        coll = db["crop_production"]
        match_query = {}
        if state:
            match_query["State_Name"] = state
        if crop:
            match_query["Crop"] = crop
            
        pipeline = [
            {"$match": match_query},
            {
                "$group": {
                    "_id": "$Crop_Year", 
                    "production": {"$sum": "$Production"}, 
                    "area": {"$sum": "$Area"}
                }
            },
            {"$sort": {"_id": 1}},
            {"$project": {"_id": 0, "year": "$_id", "production": 1, "area": 1}}
        ]
        
        trend = list(coll.aggregate(pipeline))
        if not trend:
            return {"labels": [], "production": [], "area": []}
            
        return {
            "labels": [str(t["year"]) for t in trend],
            "production": [float(t["production"] or 0) for t in trend],
            "area": [float(t["area"] or 0) for t in trend],
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/api/search")
def search(q: Optional[str] = None):
    try:
        coll = db["crop_production"]
        if not q:
            return serialize_mongo_cursor(coll.find({}).limit(20))
        
        # Searching by crop or state using regex for "ILIKE"-style behavior
        regex_q = re.compile(q, re.IGNORECASE)
        query = {
            "$or": [
                {"Crop": regex_q},
                {"State_Name": regex_q}
            ]
        }
        return serialize_mongo_cursor(coll.find(query).limit(20))
    except Exception as e:
        return {"error": str(e)}

from pydantic import BaseModel

class CropInput(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    crop: Optional[str] = None
    year: Optional[str] = None
    season: Optional[str] = None
    area: Optional[float] = 0
    area_units: Optional[str] = "Hectare"
    production: Optional[float] = 0
    production_units: Optional[str] = "Tonnes"

@router.post("/api/crops")
async def add_crop(crop_data: CropInput):
    try:
        coll = db["crop_production"]
        # Use existing field names from the CSV import mapping
        doc = {
            "State_Name": crop_data.state,
            "District_Name": crop_data.district,
            "Crop": crop_data.crop,
            "Crop_Year": crop_data.year,
            "Season": crop_data.season,
            "Area": crop_data.area,
            "Area_Units": crop_data.area_units,
            "Production": crop_data.production,
            "Production_Units": crop_data.production_units
        }
        coll.insert_one(doc)
        return {"status": "success", "message": "Crop added to MongoDB successfully"}
    except Exception as e:
        return {"error": str(e)}

