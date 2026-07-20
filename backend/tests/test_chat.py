from app.chat_schemas import ChatFields, ChatParty, ChatResult

CREDENTIALS = {"email": "chat@example.com", "password": "sup3r-secret"}

EMPTY_PARTY = {
    "company": "",
    "signerName": "",
    "signerTitle": "",
    "noticeAddress": "",
}
EMPTY_FIELDS = {
    "purpose": "",
    "effectiveDate": "",
    "mndaTermType": "expires",
    "mndaTermYears": 1,
    "confidentialityTermType": "years",
    "confidentialityTermYears": 1,
    "governingLaw": "",
    "jurisdiction": "",
    "modifications": "",
    "party1": EMPTY_PARTY,
    "party2": EMPTY_PARTY,
}


def _signup(client):
    client.post("/api/auth/signup", json=CREDENTIALS)


def _empty_fields() -> ChatFields:
    party = ChatParty(company="", signer_name="", signer_title="", notice_address="")
    return ChatFields(
        purpose="",
        effective_date="",
        mnda_term_type="expires",
        mnda_term_years=1,
        confidentiality_term_type="years",
        confidentiality_term_years=1,
        governing_law="",
        jurisdiction="",
        modifications="",
        party1=party,
        party2=party,
    )


def test_greeting_requires_auth(client):
    assert client.get("/api/chat/greeting").status_code == 401


def test_greeting_returns_message_when_authed(client):
    _signup(client)
    response = client.get("/api/chat/greeting")
    assert response.status_code == 200
    assert response.json()["message"]


def test_message_requires_auth(client):
    response = client.post(
        "/api/chat/message", json={"messages": [], "fields": EMPTY_FIELDS}
    )
    assert response.status_code == 401


def test_message_returns_reply_and_fields(client, monkeypatch):
    _signup(client)

    fields = _empty_fields()
    fields.party1.company = "Acme Inc"
    fields.governing_law = "Delaware"
    canned = ChatResult(reply="Got it. What's the purpose?", fields=fields, complete=False)
    monkeypatch.setattr("app.routers.chat.complete_chat", lambda messages, fields: canned)

    response = client.post(
        "/api/chat/message",
        json={
            "messages": [{"role": "user", "content": "Acme Inc, Delaware law"}],
            "fields": EMPTY_FIELDS,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["reply"] == "Got it. What's the purpose?"
    assert body["complete"] is False
    # Response is camelCase and mirrors the frontend NdaData shape.
    assert body["fields"]["party1"]["company"] == "Acme Inc"
    assert body["fields"]["governingLaw"] == "Delaware"
