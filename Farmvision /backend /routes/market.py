from fastapi import APIRouter, HTTPException
from database_mongo import db, format_mongo_doc
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class MarketInput(BaseModel):
    crop: str
    price: float
    market: str

@router.get("/market", response_model=List[dict])
def get_market():
    coll = db["market_prices"]
    cursor = coll.find({})
    return [format_mongo_doc(d) for d in cursor]

@router.post("/market")
async def add_market(data: MarketInput):
    try:
        coll = db["market_prices"]
        doc = {
            "crop": data.crop,
            "price": data.price,
            "market": data.market
        }
        coll.insert_one(doc)
        return {"status": "success", "message": "Market price added to MongoDB"}
    except Exception as e:
        return {"error": str(e)}
