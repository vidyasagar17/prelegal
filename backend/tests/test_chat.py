from app.chat_schemas import ChatResult, FieldValue

CREDENTIALS = {"email": "chat@example.com", "password": "sup3r-secret"}


def _signup(client):
    client.post("/api/auth/signup", json=CREDENTIALS)


def test_catalog_is_public_and_lists_all_types(client):
    response = client.get("/api/catalog")
    assert response.status_code == 200
    docs = response.json()
    assert len(docs) == 11
    ids = {d["id"] for d in docs}
    assert {"mutual-nda", "csa", "pilot", "baa", "ai-addendum"} <= ids
    # Each type exposes labelled fields.
    nda = next(d for d in docs if d["id"] == "mutual-nda")
    assert any(f["key"] == "party1Company" for f in nda["fields"])


def test_greeting_requires_auth(client):
    assert client.get("/api/chat/greeting").status_code == 401


def test_greeting_returns_message_when_authed(client):
    _signup(client)
    response = client.get("/api/chat/greeting")
    assert response.status_code == 200
    assert response.json()["message"]


def test_message_requires_auth(client):
    response = client.post(
        "/api/chat/message", json={"messages": [], "documentType": "", "fields": []}
    )
    assert response.status_code == 401


def test_message_returns_reply_type_and_fields(client, monkeypatch):
    _signup(client)

    canned = ChatResult(
        reply="Got it. What's the pilot period?",
        document_type="pilot",
        fields=[
            FieldValue(key="providerName", value="Acme"),
            FieldValue(key="customerName", value="Globex"),
        ],
        complete=False,
    )
    monkeypatch.setattr(
        "app.routers.chat.complete_chat",
        lambda messages, document_type, fields: canned,
    )

    response = client.post(
        "/api/chat/message",
        json={
            "messages": [{"role": "user", "content": "A pilot for Acme and Globex"}],
            "documentType": "",
            "fields": [],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["reply"].endswith("?")
    assert body["documentType"] == "pilot"
    assert body["complete"] is False
    values = {f["key"]: f["value"] for f in body["fields"]}
    assert values["providerName"] == "Acme"
    assert values["customerName"] == "Globex"
