"""Regression tests for the SQLite connection factory."""

import threading

from app.db import connect


def test_connection_is_usable_across_threads(tmp_path, monkeypatch):
    """FastAPI may create a request's connection on one threadpool thread and
    use it on another; the connection must not raise when that happens."""
    from app import config

    monkeypatch.setattr(config.settings, "db_path", str(tmp_path / "threads.db"))

    # Create the connection on the main thread.
    conn = connect()
    conn.execute("CREATE TABLE t (n INTEGER)")
    conn.commit()

    result: list[object] = []

    def use_from_other_thread():
        try:
            conn.execute("INSERT INTO t (n) VALUES (1)")
            result.append(conn.execute("SELECT count(*) FROM t").fetchone()[0])
        except Exception as exc:  # pragma: no cover - only on regression
            result.append(exc)

    worker = threading.Thread(target=use_from_other_thread)
    worker.start()
    worker.join()
    conn.close()

    assert result == [1]
