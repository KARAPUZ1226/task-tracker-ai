from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.models import User
from app.schemas import (
    AIDecomposeRequest,
    AIDecomposeResponse,
    AIDescriptionRequest,
    AIDescriptionResponse,
    AIDeadlineRequest,
    AIDeadlineResponse,
    AIPrioritizeRequest,
    AIPrioritizeResponse,
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.post("/decompose", response_model=AIDecomposeResponse, summary="AI декомпозиция задачи на подзадачи")
async def decompose_task(
    payload: AIDecomposeRequest,
    current_user: User = Depends(get_current_user),
):
    return await AIService.decompose(
        title=payload.title,
        description=payload.description,
        api_key=payload.api_key,
    )

@router.post("/generate-description", response_model=AIDescriptionResponse, summary="AI генерация структурированного описания")
async def generate_description(
    payload: AIDescriptionRequest,
    current_user: User = Depends(get_current_user),
):
    return await AIService.generate_description(
        title=payload.title,
        context=payload.context,
        api_key=payload.api_key,
    )

@router.post("/suggest-deadline", response_model=AIDeadlineResponse, summary="AI оценка сложности и предложение дедлайна")
async def suggest_deadline(
    payload: AIDeadlineRequest,
    current_user: User = Depends(get_current_user),
):
    return await AIService.suggest_deadline(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        api_key=payload.api_key,
    )

@router.post("/prioritize", response_model=AIPrioritizeResponse, summary="AI приоритизация задачи по контексту")
async def prioritize_task(
    payload: AIPrioritizeRequest,
    current_user: User = Depends(get_current_user),
):
    return await AIService.prioritize(
        title=payload.title,
        description=payload.description,
        api_key=payload.api_key,
    )
