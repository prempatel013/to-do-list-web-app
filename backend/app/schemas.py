from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    avatar: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str
    icon: Optional[str] = None

class ProjectOut(ProjectCreate):
    id: str

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[str] = None
    project_id: Optional[str] = None
    tags: Optional[List[str]] = []
    attachments: Optional[List[str]] = []

class TaskOut(TaskCreate):
    id: str 