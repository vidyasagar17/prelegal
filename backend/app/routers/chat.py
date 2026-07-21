"""AI chat endpoints for building a legal document, plus the document catalog.
The chat endpoints require authentication."""

from fastapi import APIRouter, Depends

from ..chat_schemas import ChatRequest, ChatResult, GreetingResponse
from ..documents import DOCUMENTS, DocumentType
from ..llm import complete_chat
from ..schemas import UserOut
from .auth import get_current_user

router = APIRouter(prefix="/api", tags=["chat"])

GREETING = (
    "Hi! I can help you draft a legal agreement — a Mutual NDA, Cloud Service "
    "Agreement, Pilot Agreement, and more. What kind of document do you need?"
)


@router.get("/catalog", response_model=list[DocumentType])
def catalog():
    """The supported document types and their fields. Public so the frontend can
    render previews before sign-in."""
    return DOCUMENTS


@router.get("/chat/greeting", response_model=GreetingResponse)
def greeting(user: UserOut = Depends(get_current_user)):
    return GreetingResponse(message=GREETING)


@router.post("/chat/message", response_model=ChatResult)
def message(body: ChatRequest, user: UserOut = Depends(get_current_user)):
    return complete_chat(body.messages, body.document_type, body.fields)
