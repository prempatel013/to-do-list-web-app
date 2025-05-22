from fastapi import APIRouter, Depends, HTTPException
from app.schemas import ProjectCreate, ProjectOut
from app.auth import get_current_user
from app.db import db
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=list[ProjectOut])
async def list_projects(current_user=Depends(get_current_user)):
    projects = await db["projects"].find({"user_id": current_user["_id"]}).to_list(100)
    return [{**project, "id": str(project["_id"])} for project in projects]

@router.post("/", response_model=ProjectOut)
async def create_project(project: ProjectCreate, current_user=Depends(get_current_user)):
    project_doc = project.dict()
    project_doc["user_id"] = current_user["_id"]
    result = await db["projects"].insert_one(project_doc)
    project_doc["_id"] = result.inserted_id
    return {**project_doc, "id": str(result.inserted_id)}

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, current_user=Depends(get_current_user)):
    project = await db["projects"].find_one({"_id": ObjectId(project_id), "user_id": current_user["_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {**project, "id": str(project["_id"])}

@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(project_id: str, project: ProjectCreate, current_user=Depends(get_current_user)):
    update_doc = project.dict()
    result = await db["projects"].update_one({"_id": ObjectId(project_id), "user_id": current_user["_id"]}, {"$set": update_doc})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Project not found or not updated")
    updated = await db["projects"].find_one({"_id": ObjectId(project_id)})
    return {**updated, "id": str(updated["_id"])}

@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user=Depends(get_current_user)):
    result = await db["projects"].delete_one({"_id": ObjectId(project_id), "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True} 