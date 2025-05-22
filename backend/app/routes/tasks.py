from fastapi import APIRouter, Depends, HTTPException, Request
from app.schemas import TaskCreate, TaskOut
from app.auth import get_current_user
from app.db import db
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=list[TaskOut])
async def list_tasks(request: Request, current_user=Depends(get_current_user)):
    try:
        print("Attempting to fetch tasks for user:", current_user["_id"])
        tasks = await db["tasks"].find({"user_id": current_user["_id"]}).to_list(100)
        print("Successfully fetched tasks:", tasks)
        return [{
            **task,
            "id": str(task["_id"]),
            "project_id": str(task["project_id"]) if task.get("project_id") else None
        } for task in tasks]
    except Exception as e:
        print("Error fetching tasks:", e)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error while fetching tasks")

@router.post("/", response_model=TaskOut)
async def create_task(request: Request, task: TaskCreate, current_user=Depends(get_current_user)):
    task_doc = task.dict()
    task_doc["user_id"] = current_user["_id"]
    if task_doc.get("project_id"):
        task_doc["project_id"] = ObjectId(task_doc["project_id"])
    result = await db["tasks"].insert_one(task_doc)
    task_doc["_id"] = result.inserted_id
    return {**task_doc, "id": str(result.inserted_id)}

@router.get("/{task_id}", response_model=TaskOut)
async def get_task(request: Request, task_id: str, current_user=Depends(get_current_user)):
    task = await db["tasks"].find_one({"_id": ObjectId(task_id), "user_id": current_user["_id"]})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {**task, "id": str(task["_id"])}

@router.put("/{task_id}", response_model=TaskOut)
async def update_task(request: Request, task_id: str, task: TaskCreate, current_user=Depends(get_current_user)):
    update_doc = task.dict()
    if update_doc.get("project_id"):
        update_doc["project_id"] = ObjectId(update_doc["project_id"])
    result = await db["tasks"].update_one({"_id": ObjectId(task_id), "user_id": current_user["_id"]}, {"$set": update_doc})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found or not updated")
    updated = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    return {**updated, "id": str(updated["_id"])}

@router.delete("/{task_id}")
async def delete_task(request: Request, task_id: str, current_user=Depends(get_current_user)):
    result = await db["tasks"].delete_one({"_id": ObjectId(task_id), "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True} 