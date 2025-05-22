from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    name: str
    email: EmailStr
    hashed_password: str
    avatar: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Project(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    name: str
    description: Optional[str] = None
    color: str
    icon: Optional[str] = None
    user_id: PyObjectId

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Task(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[str] = None
    project_id: Optional[PyObjectId] = None
    tags: Optional[List[str]] = []
    user_id: PyObjectId
    attachments: Optional[List[str]] = []

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str} 