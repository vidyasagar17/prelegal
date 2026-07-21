"""Chat request/response models.

Fields are gathered generically as key/value pairs (a list, so the shape works
with OpenAI strict structured outputs). The keys match the field specs in
documents.py for the chosen document type.
"""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from .documents import DOCUMENTS

# Constrain field keys to the ones the catalog actually defines, so the model
# (via structured outputs) cannot invent or shorten keys the frontend won't
# recognize.
_ALL_KEYS = sorted({f.key for d in DOCUMENTS for f in d.fields})
FieldKey = Enum("FieldKey", {k: k for k in _ALL_KEYS}, type=str)


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ChatMessage(CamelModel):
    role: Literal["user", "assistant"]
    content: str


class FieldValue(CamelModel):
    key: FieldKey
    value: str


class ChatResult(CamelModel):
    """What the model returns each turn: what to say, which document is being
    built, the current known field values, and whether every field is filled."""

    reply: str
    document_type: str  # a documents.py id, or "" if not yet chosen
    fields: list[FieldValue]
    complete: bool


class ChatRequest(CamelModel):
    messages: list[ChatMessage]
    document_type: str
    fields: list[FieldValue]


class GreetingResponse(CamelModel):
    message: str
