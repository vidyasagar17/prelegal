CREDENTIALS = {"email": "user@example.com", "password": "sup3r-secret"}


def test_signup_sets_cookie_and_returns_user(client):
    response = client.post("/api/auth/signup", json=CREDENTIALS)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == CREDENTIALS["email"]
    assert body["id"] >= 1
    assert "prelegal_auth" in response.cookies


def test_signup_rejects_duplicate_email(client):
    client.post("/api/auth/signup", json=CREDENTIALS)
    response = client.post("/api/auth/signup", json=CREDENTIALS)
    assert response.status_code == 409


def test_signup_normalizes_email_case(client):
    client.post("/api/auth/signup", json=CREDENTIALS)
    upper = {**CREDENTIALS, "email": "USER@example.com"}
    response = client.post("/api/auth/signup", json=upper)
    assert response.status_code == 409


def test_signup_rejects_short_password(client):
    response = client.post(
        "/api/auth/signup", json={"email": "a@b.com", "password": "short"}
    )
    assert response.status_code == 422


def test_signin_succeeds_with_correct_password(client):
    client.post("/api/auth/signup", json=CREDENTIALS)
    client.cookies.clear()
    response = client.post("/api/auth/signin", json=CREDENTIALS)
    assert response.status_code == 200
    assert response.json()["email"] == CREDENTIALS["email"]
    assert "prelegal_auth" in response.cookies


def test_signin_rejects_wrong_password(client):
    client.post("/api/auth/signup", json=CREDENTIALS)
    response = client.post(
        "/api/auth/signin", json={**CREDENTIALS, "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_signin_rejects_unknown_email(client):
    response = client.post("/api/auth/signin", json=CREDENTIALS)
    assert response.status_code == 401


def test_me_returns_current_user_when_authenticated(client):
    client.post("/api/auth/signup", json=CREDENTIALS)
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == CREDENTIALS["email"]


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_signout_clears_session(client):
    client.post("/api/auth/signup", json=CREDENTIALS)
    assert client.get("/api/auth/me").status_code == 200
    client.post("/api/auth/signout")
    client.cookies.clear()
    assert client.get("/api/auth/me").status_code == 401
