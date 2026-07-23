"""Request and response models for saved documents.

A saved document holds the whole working state of a draft: its type, the
gathered fields, and the chat transcript, so a returning user can pick up
exactly where they left off. Fields and transcript travel as plain lists and
are stored as JSON in SQLite.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class FieldValue(CamelModel):
    key: str
    value: str


class ChatMessage(CamelModel):
    role: Literal["user", "assistant"]
    content: str


class DocumentSave(CamelModel):
    """The payload sent to create or update a saved document."""

    title: str
    document_type: str
    fields: list[FieldValue]
    transcript: list[ChatMessage]
    notes: str = ""
    complete: bool = False


class DocumentSummary(CamelModel):
    """A lightweight row for the My Documents list."""

    id: int
    title: str
    document_type: str
    complete: bool
    updated_at: str


class DocumentDetail(DocumentSummary):
    """A full saved document, including its fields, transcript, and notes."""

    fields: list[FieldValue]
    transcript: list[ChatMessage]
    notes: str
