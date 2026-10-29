import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
import httpx

from app.config import settings
from app.schemas import (
    AIDecomposeResponse,
    AIDescriptionResponse,
    AIDeadlineResponse,
    AIPrioritizeResponse,
    PriorityType,
)

logger = logging.getLogger(__name__)

# Heuristic templates for resilient fallback
TECH_KEYWORDS = {
    "api": [
        "Спроектировать контракты эндпоинтов и схемы запросов/ответов",
        "Реализовать бизнес-логику и сервисный слой",
        "Настроить валидацию данных и обработку ошибок",
        "Покрыть ключевые сценарии автотестами",
        "Обновить документацию Swagger/OpenAPI"
    ],
    "auth": [
        "Спроектировать схему пользователей и хеширование паролей",
        "Реализовать регистрацию и выдачу JWT токенов",
        "Создать middleware проверки авторизации",
        "Добавить валидацию срока жизни сессии",
        "Проверить безопасность и обработку неверных учетных данных"
    ],
    "frontend": [
        "Создать макет интерфейса и компонентную структуру",
        "Настроить адаптивную верстку и состояния компонентов",
        "Подключить интеграцию с REST API клиентом",
        "Добавить индикаторы загрузки и обработку ошибок для пользователя",
        "Провести кроссбраузерное и мобильное тестирование"
    ],
    "docker": [
        "Написать оптимальный многоэтапный Dockerfile",
        "Настроить docker-compose с переменными окружения",
        "Настроить persistent volumes для сохранения данных",
        "Проверить сборку образов и время старта контейнеров",
        "Проверить сетевое взаимодействие между сервисами"
    ],
    "test": [
        "Составить матрицу тестовых сценариев и граничных случаев",
        "Написать позитивные модульные тесты",
        "Проверить негативные сценарии и валидацию входных данных",
        "Протестировать интеграционные взаимодействия компонентов",
        "Проверить отчет о покрытии кода тестами"
    ]
}

GENERAL_STEPS = [
    "Собрать требования и уточнить критерии готовности",
    "Подготовить необходимые ресурсы и инструменты",
    "Выполнить основной этап работы",
    "Провести промежуточную проверку результатов",
    "Устранить замечания и финализировать задачу"
]

def _heuristic_decompose(title: str, description: Optional[str] = None) -> List[str]:
    combined = f"{title} {description or ''}".lower()
    for kw, steps in TECH_KEYWORDS.items():
        if kw in combined:
            return steps
    if any(k in combined for k in ["баг", "fix", "ошибк", "починить"]):
        return [
            "Воспроизвести ошибку и зафиксировать шаги",
            "Локализовать проблемный участок в коде или логах",
            "Разработать и внедрить исправление",
            "Написать регрессионный тест для предотвращения повторения",
            "Проверить работоспособность на тестовом стенде"
        ]
    if any(k in combined for k in ["дизайн", "ui", "ux", "макет"]):
        return [
            "Изучить референсы и требования к визуалу",
            "Создать базовую структуру и прототип экрана",
            "Определить типографику, цветовую гамму и акценты",
            "Подготовить адаптивные версии для мобильных устройств",
            "Передать спецификацию и ассеты в разработку"
        ]
    return GENERAL_STEPS

def _heuristic_description(title: str, context: Optional[str] = None) -> str:
    ctx = f"\n\nКонтекст: {context}" if context else ""
    return (
        f"### Цель задачи\n"
        f"Успешно реализовать задачу: «{title}» в соответствии с высокими стандартами качества и надежности.\n\n"
        f"### Основные требования\n"
        f"1. Обеспечить соблюдение чистоты архитектуры и надежность исполнения.\n"
        f"2. Обработать граничные случаи и исключительные ситуации.\n"
        f"3. Подтвердить готовность тестированием и верификацией.{ctx}\n\n"
        f"### Критерии приемки (Definition of Done)\n"
        f"- [x] Весь запланированный функционал работает без сбоев.\n"
        f"- [x] Проведено тестирование ключевых сценариев.\n"
        f"- [x] Результат задокументирован и готов к использованию."
    )

def _heuristic_deadline(title: str, description: Optional[str] = None, priority: Optional[PriorityType] = "medium") -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    if priority == "urgent":
        days = 1
        reason = "Срочная задача высокой критичности, требуется выполнить в течение суток."
    elif priority == "high":
        days = 3
        reason = "Высокий приоритет с существенным влиянием на проект, оптимальный срок — 3 дня."
    elif priority == "low":
        days = 14
        reason = "Низкий приоритет, плановое выполнение в спокойном темпе за 2 недели."
    else:
        days = 7
        reason = "Стандартная задача со средней сложностью, рекомендуемый срок реализации — 1 неделя."
    
    suggested = now + timedelta(days=days)
    return {
        "suggested_deadline": suggested,
        "estimated_days": days,
        "reasoning": reason
    }

def _heuristic_prioritize(title: str, description: Optional[str] = None) -> Dict[str, Any]:
    combined = f"{title} {description or ''}".lower()
    if any(k in combined for k in ["блокер", "prod", "критич", "срочн", "fall", "пада", "drop", "broken", "security", "уязвимост", "auth fail", "авари"]):
        return {
            "suggested_priority": "urgent",
            "reasoning": "Критическая проблема, блокирующая работу сервиса или затрагивающая безопасность данных."
        }
    if any(k in combined for k in ["api", "auth", "backend", "база", "database", "миграци", "release", "релиз", "важн", "деплой", "deploy", "тест"]):
        return {
            "suggested_priority": "high",
            "reasoning": "Ключевая задача базовой функциональности или инфраструктуры проекта с высоким влиянием."
        }
    if any(k in combined for k in ["дизайн", "документ", "readme", "стил", "рефактор", "cleanup", "коммент", "иконк", "ui polish"]):
        return {
            "suggested_priority": "low",
            "reasoning": "Косметические улучшения, документация или неблокирующий рефакторинг в плановом режиме."
        }
    return {
        "suggested_priority": "medium",
        "reasoning": "Стандартная продуктовая задача регулярной разработки умеренной сложности."
    }

async def _call_gemini(prompt: str, key: str, response_format_json: bool = True) -> Optional[str]:
    # Targeted call with 3.5s timeout for snappy UX
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={key}"
    payload: Dict[str, Any] = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    if response_format_json:
        payload["generationConfig"] = {"responseMimeType": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text")
            else:
                logger.warning(f"Gemini API returned status {response.status_code}")
    except Exception as e:
        logger.warning(f"Gemini call timed out or failed: {e}")
    return None

async def _call_llm(messages: List[Dict[str, str]], api_key: Optional[str] = None, response_format_json: bool = True) -> Optional[str]:
    # Check if Gemini key is provided (either via settings or user input starting with AQ. or AIza)
    gemini_key = None
    if api_key and (api_key.startswith("AQ.") or "AIza" in api_key):
        gemini_key = api_key
    elif settings.GEMINI_API_KEY:
        gemini_key = settings.GEMINI_API_KEY

    if gemini_key:
        prompt_text = "\n\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
        gemini_res = await _call_gemini(prompt_text, gemini_key, response_format_json)
        if gemini_res:
            return gemini_res

    # Try OpenAI compatible API
    key = api_key or settings.OPENAI_API_KEY
    if not key:
        return None
    
    url = f"{settings.OPENAI_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    payload: Dict[str, Any] = {
        "model": settings.OPENAI_MODEL,
        "messages": messages,
        "temperature": 0.4,
    }
    if response_format_json:
        payload["response_format"] = {"type": "json_object"}

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                logger.warning(f"LLM API returned status {response.status_code}: {response.text}")
                return None
    except Exception as e:
        logger.warning(f"Failed to call LLM API: {e}")
        return None

class AIService:
    @staticmethod
    async def decompose(title: str, description: Optional[str] = None, api_key: Optional[str] = None) -> AIDecomposeResponse:
        system_prompt = (
            "Ты — опытный тимлид и эксперт по декомпозиции задач. "
            "Разбей указанную задачу на 3-6 четких, практических шагов (подзадач). "
            "Ответь СТРОГО в формате JSON:\n"
            "{\n"
            '  "subtasks": ["шаг 1", "шаг 2", "шаг 3"],\n'
            '  "suggested_priority": "low" | "medium" | "high" | "urgent",\n'
            '  "summary": "краткий итог плана"\n'
            "}"
        )
        user_prompt = f"Задача: {title}\nОписание: {description or 'нет'}"
        
        raw_res = await _call_llm([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ], api_key=api_key, response_format_json=True)

        if raw_res:
            try:
                parsed = json.loads(raw_res)
                subtasks = [s.strip() for s in parsed.get("subtasks", []) if isinstance(s, str) and s.strip()]
                if subtasks:
                    prio = parsed.get("suggested_priority", "medium")
                    if prio not in ["low", "medium", "high", "urgent"]:
                        prio = "medium"
                    return AIDecomposeResponse(
                        subtasks=subtasks,
                        suggested_priority=prio,
                        summary=parsed.get("summary", "План декомпозиции сформирован AI"),
                        is_fallback=False
                    )
            except Exception as e:
                logger.error(f"Error parsing LLM response: {e}")

        # Fallback
        subtasks = _heuristic_decompose(title, description)
        return AIDecomposeResponse(
            subtasks=subtasks,
            suggested_priority="medium",
            summary="Рекомендованный структурированный план подзадач",
            is_fallback=True
        )

    @staticmethod
    async def generate_description(title: str, context: Optional[str] = None, api_key: Optional[str] = None) -> AIDescriptionResponse:
        system_prompt = (
            "Ты — профессиональный технический писатель и продакт-менеджер. "
            "Составь качественное, структурированное описание для задачи на русском языке. "
            "Включи Цель, Основные шаги и Критерии готовности (Definition of Done) в формате Markdown. "
            "Ответь СТРОГО в формате JSON:\n"
            '{"description": "Текст в формате Markdown"}'
        )
        user_prompt = f"Название задачи: {title}\nДополнительный контекст: {context or 'нет'}"

        raw_res = await _call_llm([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ], api_key=api_key, response_format_json=True)

        if raw_res:
            try:
                parsed = json.loads(raw_res)
                desc = parsed.get("description", "").strip()
                if desc:
                    return AIDescriptionResponse(description=desc, is_fallback=False)
            except Exception as e:
                logger.error(f"Error parsing LLM description: {e}")

        # Fallback
        desc = _heuristic_description(title, context)
        return AIDescriptionResponse(description=desc, is_fallback=True)

    @staticmethod
    async def suggest_deadline(title: str, description: Optional[str] = None, priority: Optional[PriorityType] = "medium", api_key: Optional[str] = None) -> AIDeadlineResponse:
        system_prompt = (
            "Ты — опытный project manager. Оцени трудоемкость и сложность задачи и порекомендуй дедлайн. "
            "Ответь СТРОГО в формате JSON:\n"
            "{\n"
            '  "estimated_days": 3,\n'
            '  "reasoning": "Обоснование рекомендуемого срока"\n'
            "}"
        )
        user_prompt = f"Задача: {title}\nОписание: {description or 'нет'}\nПриоритет: {priority or 'medium'}"

        raw_res = await _call_llm([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ], api_key=api_key, response_format_json=True)

        if raw_res:
            try:
                parsed = json.loads(raw_res)
                days = int(parsed.get("estimated_days", 7))
                if days < 1:
                    days = 1
                if days > 90:
                    days = 90
                suggested = datetime.now(timezone.utc) + timedelta(days=days)
                reasoning = parsed.get("reasoning", "Срок рассчитан на основе объема и приоритета").strip()
                return AIDeadlineResponse(
                    suggested_deadline=suggested,
                    estimated_days=days,
                    reasoning=reasoning,
                    is_fallback=False
                )
            except Exception as e:
                logger.error(f"Error parsing LLM deadline: {e}")

        # Fallback
        res = _heuristic_deadline(title, description, priority)
        return AIDeadlineResponse(
            suggested_deadline=res["suggested_deadline"],
            estimated_days=res["estimated_days"],
            reasoning=res["reasoning"],
            is_fallback=True
        )

    @staticmethod
    async def prioritize(title: str, description: Optional[str] = None, api_key: Optional[str] = None) -> AIPrioritizeResponse:
        system_prompt = (
            "Ты — опытный инженер и project manager. Оцени приоритет указанной задачи (low, medium, high или urgent) на основе ее критичности и влияния. "
            "Ответь СТРОГО в формате JSON:\n"
            "{\n"
            '  "suggested_priority": "low" | "medium" | "high" | "urgent",\n'
            '  "reasoning": "Краткое обоснование выбора приоритета"\n'
            "}"
        )
        user_prompt = f"Задача: {title}\nОписание: {description or 'нет'}"

        raw_res = await _call_llm([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ], api_key=api_key, response_format_json=True)

        if raw_res:
            try:
                parsed = json.loads(raw_res)
                prio = parsed.get("suggested_priority", "medium")
                if prio not in ["low", "medium", "high", "urgent"]:
                    prio = "medium"
                reasoning = parsed.get("reasoning", "Приоритет оценен AI на основе контекста").strip()
                return AIPrioritizeResponse(
                    suggested_priority=prio,
                    reasoning=reasoning,
                    is_fallback=False
                )
            except Exception as e:
                logger.error(f"Error parsing LLM prioritize: {e}")

        # Fallback
        res = _heuristic_prioritize(title, description)
        return AIPrioritizeResponse(
            suggested_priority=res["suggested_priority"],
            reasoning=res["reasoning"],
            is_fallback=True
        )
