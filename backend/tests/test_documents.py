CREDENTIALS = {"email": "owner@example.com", "password": "sup3r-secret"}
OTHER = {"email": "intruder@example.com", "password": "sup3r-secret"}

SAMPLE = {
    "title": "NDA with Globex",
    "documentType": "mutual-nda",
    "fields": [{"key": "party1Company", "value": "Acme"}],
    "transcript": [
        {"role": "assistant", "content": "Which document?"},
        {"role": "user", "content": "An NDA with Globex"},
    ],
    "complete": False,
}


def _signup(client, creds=CREDENTIALS):
    client.post("/api/auth/signup", json=creds)


def test_documents_require_auth(client):
    assert client.get("/api/documents").status_code == 401
    assert client.post("/api/documents", json=SAMPLE).status_code == 401


def test_create_and_get_document_roundtrips_state(client):
    _signup(client)
    created = client.post("/api/documents", json=SAMPLE)
    assert created.status_code == 201
    doc = created.json()
    assert doc["id"] >= 1
    assert doc["title"] == "NDA with Globex"

    fetched = client.get(f"/api/documents/{doc['id']}").json()
    assert fetched["documentType"] == "mutual-nda"
    assert fetched["fields"] == SAMPLE["fields"]
    assert fetched["transcript"] == SAMPLE["transcript"]
    assert fetched["complete"] is False
    # Notes default to empty when omitted.
    assert fetched["notes"] == ""


def test_notes_are_saved_and_updated(client):
    _signup(client)
    doc_id = client.post(
        "/api/documents", json={**SAMPLE, "notes": "Call legal on Monday"}
    ).json()["id"]
    assert client.get(f"/api/documents/{doc_id}").json()["notes"] == "Call legal on Monday"

    client.put(f"/api/documents/{doc_id}", json={**SAMPLE, "notes": "Reviewed, ready"})
    assert client.get(f"/api/documents/{doc_id}").json()["notes"] == "Reviewed, ready"


def test_list_returns_summaries_newest_first(client):
    _signup(client)
    client.post("/api/documents", json={**SAMPLE, "title": "First"})
    client.post("/api/documents", json={**SAMPLE, "title": "Second"})
    rows = client.get("/api/documents").json()
    assert [r["title"] for r in rows] == ["Second", "First"]
    # Summaries omit the heavy fields/transcript payload.
    assert "fields" not in rows[0]


def test_update_replaces_fields_and_marks_complete(client):
    _signup(client)
    doc_id = client.post("/api/documents", json=SAMPLE).json()["id"]
    updated = client.put(
        f"/api/documents/{doc_id}",
        json={
            **SAMPLE,
            "title": "NDA final",
            "fields": [{"key": "party1Company", "value": "Acme Inc"}],
            "complete": True,
        },
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["title"] == "NDA final"
    assert body["fields"][0]["value"] == "Acme Inc"
    assert body["complete"] is True


def test_delete_removes_document(client):
    _signup(client)
    doc_id = client.post("/api/documents", json=SAMPLE).json()["id"]
    assert client.delete(f"/api/documents/{doc_id}").status_code == 204
    assert client.get(f"/api/documents/{doc_id}").status_code == 404


def test_documents_are_scoped_to_their_owner(client):
    _signup(client)
    doc_id = client.post("/api/documents", json=SAMPLE).json()["id"]

    # A different user must not see or touch the first user's document.
    client.post("/api/auth/signout")
    client.cookies.clear()
    _signup(client, OTHER)
    assert client.get("/api/documents").json() == []
    assert client.get(f"/api/documents/{doc_id}").status_code == 404
    assert client.put(f"/api/documents/{doc_id}", json=SAMPLE).status_code == 404
    assert client.delete(f"/api/documents/{doc_id}").status_code == 404


def test_get_missing_document_returns_404(client):
    _signup(client)
    assert client.get("/api/documents/999").status_code == 404
