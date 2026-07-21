"""LLM call for the document chat: OpenAI platform via LiteLLM with structured
outputs. Isolated here so routes stay thin and tests can monkeypatch it."""

import datetime as dt

from litellm import completion

from .chat_schemas import ChatMessage, ChatResult, FieldValue
from .config import settings
from .documents import DOCUMENTS, DOCUMENTS_BY_ID


def _catalog_text() -> str:
    lines = []
    for doc in DOCUMENTS:
        lines.append(f'- id "{doc.id}" ({doc.name}): {doc.description}')
    return "\n".join(lines)


def _fields_text(document_type: str) -> str:
    doc = DOCUMENTS_BY_ID.get(document_type)
    if doc is None:
        return "No document type chosen yet. Ask the user which document they need."
    lines = [f"Fields for {doc.name} (id {doc.id}):"]
    for f in doc.fields:
        lines.append(f"- {f.key}: {f.description}")
    return "\n".join(lines)


SYSTEM_PROMPT = """You are a friendly assistant that helps a user create a \
legal agreement through natural conversation, not a rigid form.

You support these document types:
{catalog}

First, work out which document the user wants and set documentType to its id. \
If it is unclear, ask which document they need.

Once the document type is known, gather its fields by chatting naturally. Ask \
about one or two things at a time.

{fields}

Every turn, return:
- reply: what to say next to the user.
- documentType: the id of the chosen document (empty string if not chosen yet).
- fields: the current known values as a list of {{key, value}} objects. You \
MUST use the exact field keys listed above, character for character (for \
example "providerName", never "provider"). Do not invent, shorten, or rename \
keys. Include every value you have gathered so far, and never drop a value the \
user already gave.
- complete: true only once every field for the document type has a value.

Important: whenever you still need more information, your reply MUST end with a \
clear question asking for the next missing detail. Never end your reply without \
a question unless the document is complete.

Today's date is {today}."""


def _system_message(document_type: str, fields: list[FieldValue]) -> dict:
    content = SYSTEM_PROMPT.format(
        catalog=_catalog_text(),
        fields=_fields_text(document_type),
        today=dt.date.today().isoformat(),
    )
    known = {f.key: f.value for f in fields}
    content += f"\n\nDocument type so far: {document_type or '(none)'}"
    content += f"\nFields gathered so far (JSON): {known}"
    return {"role": "system", "content": content}


def complete_chat(
    messages: list[ChatMessage], document_type: str, fields: list[FieldValue]
) -> ChatResult:
    convo = [_system_message(document_type, fields)]
    convo += [{"role": m.role, "content": m.content} for m in messages]
    response = completion(
        model=settings.chat_model,
        messages=convo,
        response_format=ChatResult,
        api_key=settings.openai_api_key,
    )
    content = response.choices[0].message.content
    return ChatResult.model_validate_json(content)
