"""Chat request/response models.

The extracted-fields shape mirrors the frontend `NdaData` interface exactly
(camelCase, via aliases) so the model's JSON flows straight into the UI with no
translation. Every field is required so the response satisfies OpenAI strict
structured outputs; unknown values are empty strings or sensible defaults.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ChatMessage(CamelModel):
    role: Literal["user", "assistant"]
    content: str


class ChatParty(CamelModel):
    company: str
    signer_name: str
    signer_title: str
    notice_address: str


class ChatFields(CamelModel):
    purpose: str
    effective_date: str  # ISO yyyy-mm-dd, or empty
    mnda_term_type: Literal["expires", "until_terminated"]
    mnda_term_years: int
    confidentiality_term_type: Literal["years", "perpetuity"]
    confidentiality_term_years: int
    governing_law: str
    jurisdiction: str
    modifications: str
    party1: ChatParty
    party2: ChatParty


class ChatResult(CamelModel):
    """What the model returns each turn: what to say, the current best-known
    fields, and whether every required field has been gathered."""

    reply: str
    fields: ChatFields
    complete: bool


class ChatRequest(CamelModel):
    messages: list[ChatMessage]
    fields: ChatFields


class GreetingResponse(CamelModel):
    message: str
