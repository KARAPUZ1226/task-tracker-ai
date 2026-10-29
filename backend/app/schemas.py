from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserRegister(UserBase):
    password: str = Field(..., min_length=6, description="Password at least 6 characters")

class UserLogin(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Subtask Schemas
class SubtaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)

class SubtaskCreate(SubtaskBase):
    pass

class SubtaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    is_completed: Optional[bool] = None

class SubtaskOut(SubtaskBase):
    id: int
    task_id: int
    is_completed: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

# Task Schemas
PriorityType = Literal["low", "medium", "high", "urgent"]
StatusType = Literal["todo", "in_progress", "done"]

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: PriorityType = "medium"
    deadline: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def validate_title_not_empty(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Название задачи не может быть пустым")
        return clean

class TaskCreate(TaskBase):
    subtasks: Optional[List[str]] = Field(default_factory=list, description="Optional initial subtask titles")

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[PriorityType] = None
    status: Optional[StatusType] = None
    deadline: Optional[datetime] = None
    subtasks: Optional[List[str]] = Field(None, description="Optional subtasks to sync or add")

    @field_validator("title")
    @classmethod
    def validate_title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if not clean:
                raise ValueError("Название задачи не может быть пустым")
            return clean
        return v

class TaskOut(TaskBase):
    id: int
    user_id: int
    status: StatusType
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubtaskOut] = []
    model_config = ConfigDict(from_attributes=True)

# AI Schemas
class AIDecomposeRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    api_key: Optional[str] = None

class AIDecomposeResponse(BaseModel):
    subtasks: List[str]
    suggested_priority: Optional[PriorityType] = None
    summary: Optional[str] = None
    is_fallback: bool = False

class AIDescriptionRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    context: Optional[str] = None
    api_key: Optional[str] = None

class AIDescriptionResponse(BaseModel):
    description: str
    is_fallback: bool = False

class AIDeadlineRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    priority: Optional[PriorityType] = "medium"
    api_key: Optional[str] = None

class AIDeadlineResponse(BaseModel):
    suggested_deadline: datetime
    estimated_days: int
    reasoning: str
    is_fallback: bool = False

class AIPrioritizeRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    api_key: Optional[str] = None

class AIPrioritizeResponse(BaseModel):
    suggested_priority: PriorityType
    reasoning: str
    is_fallback: bool = False
