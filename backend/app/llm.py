"""LLM call for the NDA chat: OpenAI platform via LiteLLM with structured
outputs. Isolated here so routes stay thin and tests can monkeypatch it."""

import datetime as dt

from litellm import completion

from .chat_schemas import ChatFields, ChatMessage, ChatResult
from .config import settings

SYSTEM_PROMPT = """You are a friendly assistant that helps a user create a \
Common Paper Mutual Non-Disclosure Agreement (Mutual NDA) through natural \
conversation, not a rigid form.

Chat naturally and gather the values needed to fill in the agreement. Ask about \
one or two things at a time. Confirm what you have when everything is gathered.

The fields to fill in:
- purpose: how the confidential information may be used
- effectiveDate: the effective date, as ISO yyyy-mm-dd
- mndaTermType: "expires" (after a number of years) or "until_terminated"
- mndaTermYears: number of years the NDA lasts (used when mndaTermType is "expires")
- confidentialityTermType: "years" or "perpetuity"
- confidentialityTermYears: years confidentiality lasts (used when type is "years")
- governingLaw: the US state whose law governs the agreement
- jurisdiction: the city/county and state where disputes are handled
- modifications: any changes to the standard terms (optional; empty if none)
- party1 and party2, each with: company, signerName, signerTitle, noticeAddress

Every turn, return:
- reply: the next thing to say to the user (conversational, concise)
- fields: your current best understanding of ALL fields. Use empty strings for \
values you do not know yet. Keep values already gathered.
- complete: true only once purpose, effectiveDate, governingLaw, jurisdiction, \
and both parties' company names are known.

Today's date is {today}."""


def _system_message(fields: ChatFields) -> dict:
    content = SYSTEM_PROMPT.format(today=dt.date.today().isoformat())
    content += "\n\nFields gathered so far (JSON):\n" + fields.model_dump_json(
        by_alias=True
    )
    return {"role": "system", "content": content}


def complete_chat(messages: list[ChatMessage], fields: ChatFields) -> ChatResult:
    convo = [_system_message(fields)]
    convo += [{"role": m.role, "content": m.content} for m in messages]
    response = completion(
        model=settings.chat_model,
        messages=convo,
        response_format=ChatResult,
        api_key=settings.openai_api_key,
    )
    content = response.choices[0].message.content
    return ChatResult.model_validate_json(content)
