from fastapi import APIRouter, Depends, HTTPException
from app.schemas import UserOut
from app.auth import get_current_user
from app.db import db
from bson import ObjectId

router = APIRouter()

@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str, current_user=Depends(get_current_user)):
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "avatar": user.get("avatar"),
    }

@router.put("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, user_update: UserOut, current_user=Depends(get_current_user)):
    if str(current_user["_id"]) != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    await db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": user_update.dict(exclude_unset=True)})
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "avatar": user.get("avatar"),
    } 