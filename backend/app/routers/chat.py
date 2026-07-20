"""AI chat endpoints for building a Mutual NDA. Both require authentication."""

from fastapi import APIRouter, Depends

from ..chat_schemas import ChatRequest, ChatResult, GreetingResponse
from ..llm import complete_chat
from ..schemas import UserOut
from .auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])

GREETING = (
    "Hi! I'll help you put together a Mutual NDA. To start, which two companies "
    "are entering into this agreement?"
)


@router.get("/greeting", response_model=GreetingResponse)
def greeting(user: UserOut = Depends(get_current_user)):
    return GreetingResponse(message=GREETING)


@router.post("/message", response_model=ChatResult)
def message(body: ChatRequest, user: UserOut = Depends(get_current_user)):
    return complete_chat(body.messages, body.fields)
