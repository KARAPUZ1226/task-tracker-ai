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

# Semantic domain templates for intelligent context-aware fallback
SEMANTIC_DOMAINS = [
    # 1. Household & everyday chores
    {
        "keywords": ["помыть", "убор", "стир", "квартир", "комнат", "посуд", "мусор", "пылесос", "готовк", "приготов", "обед", "ужин", "завтрак", "еда", "вещ", "полк", "окн", "чистк"],
        "steps": [
            "Подготовить необходимые чистящие средства, инвентарь или ингредиенты",
            "Освободить и расчистить рабочее пространство",
            "Выполнить основную часть задачи аккуратно и последовательно",
            "Проверить чистоту, порядок и устранить оставшиеся мелочи",
            "Сложить инвентарь по местам и оценить результат"
        ],
        "desc": (
            "### Описание задачи\n"
            "Необходимо навести порядок и выполнить бытовую задачу: **{title}**.\n\n"
            "### План выполнения\n"
            "- **Подготовка:** Собрать нужные принадлежности и подготовить зону.\n"
            "- **Основной процесс:** Последовательно выполнить всю работу.\n"
            "- **Завершение:** Убрать инвентарь и проверить результат.\n\n"
            "### Критерии готовности\n"
            "- [x] Пространство чистое и приведено в полный порядок.\n"
            "- [x] Все вещи разложены по своим местам."
        )
    },
    # 2. Shopping & groceries
    {
        "keywords": ["купить", "покупк", "магазин", "заказ", "доставк", "оплат", "продукты", "аптек", "рынок", "шопинг"],
        "steps": [
            "Составить четкий список необходимых покупок и проверить остатки",
            "Определить бюджет и выбрать оптимальный магазин или сервис доставки",
            "Найти нужные позиции и проверить сроки годности/характеристики",
            "Совершить оплату и сохранить чек",
            "Разобрать покупки и разложить по местам хранения"
        ],
        "desc": (
            "### Описание задачи\n"
            "Плановая покупка или заказ: **{title}**.\n\n"
            "### План выполнения\n"
            "- **Список:** Уточнить необходимые позиции и лимит бюджета.\n"
            "- **Приобретение:** Оформить заказ или посетить магазин.\n"
            "- **Контроль:** Проверить комплектацию и качество товаров.\n\n"
            "### Критерии готовности\n"
            "- [x] Все необходимые товары приобретены.\n"
            "- [x] Бюджет соблюден, чек сохранен."
        )
    },
    # 3. Learning & study & books
    {
        "keywords": ["учить", "выучить", "прочитать", "книг", "курс", "лекци", "экзамен", "сесси", "диплом", "стать", "урок", "дз", "домашк", "английск", "язык", "конспект", "материал", "теори"],
        "steps": [
            "Выделить ключевые темы и составить расписание занятий",
            "Изучить теоретический материал или прочитать нужные разделы",
            "Сделать краткий конспект ключевых понятий и правил",
            "Закрепить знания на практических упражнениях или тестах",
            "Повторить сложный материал и проверить усвоение"
        ],
        "desc": (
            "### Описание задачи\n"
            "Учебный процесс и повышение квалификации: **{title}**.\n\n"
            "### План выполнения\n"
            "- **Теория:** Изучить профильный материал и сделать заметки.\n"
            "- **Практика:** Отработать знания на примерах и задачах.\n"
            "- **Проверка:** Закрепить усвоенное и закрыть пробелы.\n\n"
            "### Критерии готовности\n"
            "- [x] Материал освоен и зафиксирован в заметках.\n"
            "- [x] Практические упражнения успешно решены."
        )
    },
    # 4. Sports & health
    {
        "keywords": ["тренировк", "зал", "спорт", "бег", "врач", "поликлиник", "здоров", "диета", "упражнен", "бассейн", "разминк"],
        "steps": [
            "Подготовить спортивную форму, экипировку или медицинские документы",
            "Провести качественную разминку или подготовить визит",
            "Выполнить запланированный комплекс упражнений или рекомендаций",
            "Сделать заминку/растяжку и зафиксировать самочувствие",
            "Записать результаты или назначенные шаги в трекер"
        ],
        "desc": (
            "### Описание задачи\n"
            "Забота о здоровье и физической форме: **{title}**.\n\n"
            "### План выполнения\n"
            "- **Подготовка:** Подготовить экипировку и план нагрузки.\n"
            "- **Выполнение:** Отработать намеченную программу с соблюдением техники.\n"
            "- **Восстановление:** Зафиксировать самочувствие и результаты.\n\n"
            "### Критерии готовности\n"
            "- [x] Тренировка или процедура выполнена в полном объеме.\n"
            "- [x] Результаты зафиксированы."
        )
    },
    # 5. Work, business & management
    {
        "keywords": ["отчет", "договор", "клиент", "встреч", "совещан", "презентац", "звонок", "бюджет", "счет", "резюме", "собеседован", "документ"],
        "steps": [
            "Собрать исходные данные, вводные требования и контекст",
            "Подготовить черновик документа, презентации или повестку встречи",
            "Согласовать ключевые пункты с заинтересованными лицами",
            "Внести финальные правки и утвердить итоговый вариант",
            "Отправить адресату и зафиксировать следующий шаг"
        ],
        "desc": (
            "### Описание задачи\n"
            "Деловая и рабочая активность: **{title}**.\n\n"
            "### План выполнения\n"
            "- **Анализ:** Собрать фактуру и подготовить черновик.\n"
            "- **Согласование:** Провести обсуждение и внести правки.\n"
            "- **Финализация:** Зафиксировать результат и договоренности.\n\n"
            "### Критерии готовности\n"
            "- [x] Документ/встреча подготовлены и согласованы.\n"
            "- [x] Действие зафиксировано в календаре/отчете."
        )
    },
    # 6. IT & Software Development (API, Docker, Auth, Frontend, Tests, Bugs)
    {
        "keywords": ["api", "эндпоинт", "endpoint", "rest", "swagger"],
        "steps": [
            "Спроектировать контракты эндпоинтов и схемы запросов/ответов",
            "Реализовать бизнес-логику и сервисный слой",
            "Настроить валидацию данных и обработку ошибок",
            "Покрыть ключевые сценарии автотестами",
            "Обновить документацию Swagger/OpenAPI"
        ],
        "desc": (
            "### Описание задачи\n"
            "Разработка и интеграция API эндпоинтов: **{title}**.\n\n"
            "### Основные шаги\n"
            "- Спроектировать контракты и Pydantic/DTO схемы.\n"
            "- Реализовать бизнес-логику и валидацию данных.\n"
            "- Написать автотесты на позитивные и граничные сценарии.\n\n"
            "### Критерии готовности\n"
            "- [x] Эндпоинты возвращают корректные HTTP-статусы и данные.\n"
            "- [x] Тесты успешно пройдены, документация обновлена."
        )
    },
    {
        "keywords": ["auth", "авториз", "аутентифик", "парол", "jwt", "логин", "login", "register"],
        "steps": [
            "Спроектировать схему пользователей и безопасное хеширование паролей",
            "Реализовать регистрацию и выдачу JWT токенов",
            "Создать middleware и зависимости проверки авторизации",
            "Добавить обработку истечения сессий и валидацию прав",
            "Проверить сценарии безопасности и защиту от несанкционированного доступа"
        ],
        "desc": (
            "### Описание задачи\n"
            "Модуль аутентификации и безопасности: **{title}**.\n\n"
            "### Основные шаги\n"
            "- Реализовать регистрацию, логин и генерацию JWT.\n"
            "- Настроить хеширование паролей и проверку токенов.\n"
            "- Проверить сценарии защиты и ограничение доступа.\n\n"
            "### Критерии готовности\n"
            "- [x] Токены корректно валидируются в защищенных роутах.\n"
            "- [x] Неверные пароли и поддельные токены надежно отклоняются."
        )
    },
    {
        "keywords": ["docker", "compose", "деплой", "deploy", "nginx", "контейнер", "сервер", "vps"],
        "steps": [
            "Подготовить оптимальный многоэтапный Dockerfile",
            "Настроить docker-compose с переменными окружения и сетями",
            "Настроить persistent volumes для сохранения данных",
            "Проверить сборку образов и сетевое взаимодействие сервисов",
            "Протестировать стабильность работы контейнеров под нагрузкой"
        ],
        "desc": (
            "### Описание задачи\n"
            "Контейнеризация и настройка инфраструктуры: **{title}**.\n\n"
            "### Основные шаги\n"
            "- Подготовить Dockerfile и docker-compose.yml.\n"
            "- Настроить проксирование Nginx и переменные окружения.\n"
            "- Проверить перезапуск и сохранение данных в volumes.\n\n"
            "### Критерии готовности\n"
            "- [x] Все сервисы запускаются без ошибок одной командой.\n"
            "- [x] Приложение доступно и корректно отвечает по портам."
        )
    },
    {
        "keywords": ["баг", "bug", "fix", "починить", "ошибк", "упал", "crash", "broken"],
        "steps": [
            "Воспроизвести проблему и зафиксировать точные шаги и логи",
            "Локализовать проблемный участок кода или конфигурации",
            "Разработать точечное исправление без побочных эффектов",
            "Написать регрессионный тест для предотвращения повтора",
            "Проверить исправление на тестовом стенде"
        ],
        "desc": (
            "### Описание задачи\n"
            "Локализация и устранение дефекта: **{title}**.\n\n"
            "### Основные шаги\n"
            "- Воспроизвести баг и изучить логи.\n"
            "- Внедрить минимальное точечное исправление.\n"
            "- Написать автотест для фиксации стабильности.\n\n"
            "### Критерии готовности\n"
            "- [x] Ошибка больше не воспроизводится.\n"
            "- [x] Существующий функционал работает без регрессий."
        )
    },
    {
        "keywords": ["frontend", "дизайн", "ui", "ux", "верстк", "макет", "css", "компонент", "react"],
        "steps": [
            "Определить структуру экрана, иерархию элементов и состояния",
            "Создать адаптивные компоненты с поддержкой мобильных устройств",
            "Настроить гармоничную цветовую схему и микро-взаимодействия",
            "Подключить интеграцию с данными API и обработку состояний загрузки",
            "Проверить плавность анимаций и удобство интерфейса"
        ],
        "desc": (
            "### Описание задачи\n"
            "Интерфейс и пользовательский опыт: **{title}**.\n\n"
            "### Основные шаги\n"
            "- Спроектировать компонентную структуру и верстку.\n"
            "- Настроить отзывчивый дизайн для мобильных устройств.\n"
            "- Добавить плавные микро-анимации и обработку ошибок.\n\n"
            "### Критерии готовности\n"
            "- [x] Интерфейс отзывчив, приятен и удобен в использовании.\n"
            "- [x] Нет графических артефактов на экранах любого размера."
        )
    }
]

def _heuristic_decompose(title: str, description: Optional[str] = None) -> List[str]:
    combined = f"{title} {description or ''}".lower()
    for domain in SEMANTIC_DOMAINS:
        if any(kw in combined for kw in domain["keywords"]):
            return domain["steps"]
    
    # Dynamic context-aware decomposition incorporating the actual title
    clean_title = title.strip()
    return [
        f"Уточнить конкретные детали и требования для: «{clean_title}»",
        "Подготовить необходимые ресурсы, инструменты и рабочее место",
        f"Выполнить основную практическую работу по задаче",
        "Проверить качество результата и устранить недочеты",
        f"Завершить выполнение задачи «{clean_title}» и зафиксировать итог"
    ]

def _heuristic_description(title: str, context: Optional[str] = None) -> str:
    combined = f"{title} {context or ''}".lower()
    ctx_note = f"\n\n**Контекст задачи:** {context.strip()}" if context and context.strip() else ""
    
    for domain in SEMANTIC_DOMAINS:
        if any(kw in combined for kw in domain["keywords"]):
            template = domain["desc"]
            return template.format(title=title.strip()) + ctx_note
            
    # Tailored general markdown template
    clean_title = title.strip()
    return (
        f"### Цель задачи\n"
        f"Успешно выполнить задачу: **«{clean_title}»** с соблюдением намеченных сроков и критериев качества.{ctx_note}\n\n"
        f"### План реализации\n"
        f"- **1. Подготовка:** Собрать вводные данные и определить порядок действий.\n"
        f"- **2. Выполнение:** Реализовать ключевые шаги задачи «{clean_title}».\n"
        f"- **3. Контроль:** Провести финальную проверку результата.\n\n"
        f"### Критерии готовности\n"
        f"- [x] Все запланированные действия выполнены в полном объеме.\n"
        f"- [x] Результат проверен и готов к использованию."
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
        reason = "Стандартная задача умеренной сложности, рекомендуемый срок реализации — 1 неделя."
    
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
            "reasoning": "Критическая проблема, блокирующая работу сервиса или требующая немедленного решения."
        }
    if any(k in combined for k in ["api", "auth", "backend", "база", "database", "миграци", "release", "релиз", "важн", "деплой", "deploy", "тест"]):
        return {
            "suggested_priority": "high",
            "reasoning": "Ключевая задача базовой функциональности или инфраструктуры с высоким приоритетом."
        }
    if any(k in combined for k in ["дизайн", "документ", "readme", "стил", "рефактор", "cleanup", "коммент", "иконк", "ui polish"]):
        return {
            "suggested_priority": "low",
            "reasoning": "Косметические улучшения, документация или неблокирующий рефакторинг в плановом режиме."
        }
    return {
        "suggested_priority": "medium",
        "reasoning": "Стандартная задача регулярной работы умеренной сложности."
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
            "Ты — опытный практичный тимлид и личный помощник по продуктивности. "
            "Разбей указанную задачу на 3-6 четких, конкретных и практически полезных шагов (подзадач). "
            "ВАЖНО: шаги должны быть строго привязаны к реальной теме задачи (если это уборка или покупка — пиши бытовые шаги; если учеба — учебные; если разработка — технические). "
            "Никаких общих абстрактных фраз и клише вроде 'чистоты архитектуры'. "
            "Ответь СТРОГО в формате JSON:\n"
            "{\n"
            '  "subtasks": ["конкретный шаг 1", "конкретный шаг 2", "конкретный шаг 3"],\n'
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
            "Ты — опытный персональный помощник и технический писатель. "
            "Составь качественное, живое и понятное структурированное описание для задачи на русском языке. "
            "ВАЖНО: описание должно полностью соответствовать реальной теме задачи. Никаких шаблонных клише вроде 'чистоты архитектуры', если задача не про IT-архитектуру. "
            "Используй красивый Markdown: заголовки ###, списки с дефисом, жирный шрифт для ключевых акцентов. "
            "Включи разделы:\n"
            "### Цель задачи\n"
            "### План выполнения\n"
            "### Критерии готовности\n"
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
