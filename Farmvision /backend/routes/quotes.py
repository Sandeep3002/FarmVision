from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from database_mongo import db, format_mongo_doc
from bson import ObjectId

router = APIRouter()

class QuoteBase(BaseModel):
    text: Optional[str] = None
    author: Optional[str] = None

class Quote(QuoteBase):
    id: str

@router.post("/quotes/", response_model=Quote)
async def create_quote(quote: QuoteBase):
    try:
        coll = db["quotes"]
        doc = {"quote": quote.text, "author": quote.author}
        result = coll.insert_one(doc)
        return {
            "id": str(result.inserted_id),
            "text": quote.text,
            "author": quote.author
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quotes/", response_model=List[Quote])
def list_quotes():
    coll = db["quotes"]
    cursor = coll.find({})
    quotes = []
    for doc in cursor:
        quotes.append({
            "id": str(doc["_id"]),
            "text": doc.get("quote"),
            "author": doc.get("author")
        })
    return quotes

@router.get("/quotes/{quote_id}", response_model=Quote)
def get_quote(quote_id: str):
    try:
        coll = db["quotes"]
        doc = coll.find_one({"_id": ObjectId(quote_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Quote not found")
        return {
            "id": str(doc["_id"]),
            "text": doc.get("quote"),
            "author": doc.get("author")
        }
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

@router.delete("/quotes/{quote_id}")
def delete_quote(quote_id: str):
    try:
        coll = db["quotes"]
        result = coll.delete_one({"_id": ObjectId(quote_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Quote not found")
        return {"detail": "Quote deleted"}
    except Exception:
         raise HTTPException(status_code=400, detail="Invalid ID format")
