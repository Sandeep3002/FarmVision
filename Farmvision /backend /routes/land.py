from fastapi import APIRouter, HTTPException
from database_mongo import db, format_mongo_doc
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class LandInput(BaseModel):
    land_type: str
    area: float
    location: str
    owner: str

@router.get("/land", response_model=List[dict])
def get_land():
    coll = db["land_data"]
    cursor = coll.find({})
    return [format_mongo_doc(d) for d in cursor]

@router.post("/land")
async def add_land(data: LandInput):
    try:
        coll = db["land_data"]
        doc = {
            "land_type": data.land_type,
            "area": data.area,
            "location": data.location,
            "owner": data.owner
        }
        coll.insert_one(doc)
        return {"status": "success", "message": "Land data added to MongoDB"}
    except Exception as e:
        return {"error": str(e)}
