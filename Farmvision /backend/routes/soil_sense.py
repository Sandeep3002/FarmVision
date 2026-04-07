from fastapi import APIRouter, HTTPException
from database_mongo import db, format_mongo_doc
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class SoilInput(BaseModel):
    ph_level: float
    nitrogen: float
    phosphorus: float
    potassium: float
    location: str

@router.get("/soil-health", response_model=List[dict])
def get_soil_health():
    coll = db["soil_health"]
    cursor = coll.find({})
    return [format_mongo_doc(d) for d in cursor]

@router.post("/soil-health")
async def add_soil_health(data: SoilInput):
    try:
        coll = db["soil_health"]
        doc = {
            "ph_level": data.ph_level,
            "nitrogen": data.nitrogen,
            "phosphorus": data.phosphorus,
            "potassium": data.potassium,
            "location": data.location
        }
        coll.insert_one(doc)
        return {"status": "success", "message": "Soil health record added to MongoDB"}
    except Exception as e:
        return {"error": str(e)}
