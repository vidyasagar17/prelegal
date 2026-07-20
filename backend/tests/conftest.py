import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    """A TestClient backed by a fresh temp database per test.

    frontend_dir is pointed at a nonexistent path so no static mount is added.
    Entering the TestClient context runs the app lifespan, which creates the
    schema.
    """
    from app import config

    monkeypatch.setattr(config.settings, "db_path", str(tmp_path / "test.db"))
    monkeypatch.setattr(config.settings, "frontend_dir", str(tmp_path / "no-frontend"))

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
