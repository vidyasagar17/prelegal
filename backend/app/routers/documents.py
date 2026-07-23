"""CRUD endpoints for a user's saved documents. Every endpoint requires
authentication and only ever touches rows owned by the current user."""

import json
import sqlite3

from fastapi import APIRouter, Depends, HTTPException, status

from ..db import get_db
from ..document_schemas import DocumentDetail, DocumentSave, DocumentSummary
from ..schemas import UserOut
from .auth import get_current_user

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _detail(row: sqlite3.Row) -> DocumentDetail:
    return DocumentDetail(
        id=row["id"],
        title=row["title"],
        document_type=row["document_type"],
        complete=bool(row["complete"]),
        updated_at=row["updated_at"],
        fields=json.loads(row["fields"]),
        transcript=json.loads(row["transcript"]),
    )


def _owned_row(doc_id: int, user_id: int, db: sqlite3.Connection) -> sqlite3.Row:
    row = db.execute(
        "SELECT * FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id)
    ).fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )
    return row


@router.get("", response_model=list[DocumentSummary])
def list_documents(
    user: UserOut = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db),
):
    rows = db.execute(
        "SELECT id, title, document_type, complete, updated_at FROM documents "
        "WHERE user_id = ? ORDER BY updated_at DESC, id DESC",
        (user.id,),
    ).fetchall()
    return [
        DocumentSummary(
            id=r["id"],
            title=r["title"],
            document_type=r["document_type"],
            complete=bool(r["complete"]),
            updated_at=r["updated_at"],
        )
        for r in rows
    ]


@router.post("", response_model=DocumentDetail, status_code=status.HTTP_201_CREATED)
def create_document(
    body: DocumentSave,
    user: UserOut = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db),
):
    cursor = db.execute(
        "INSERT INTO documents (user_id, title, document_type, fields, transcript, "
        "complete) VALUES (?, ?, ?, ?, ?, ?)",
        (
            user.id,
            body.title,
            body.document_type,
            json.dumps([f.model_dump() for f in body.fields]),
            json.dumps([m.model_dump() for m in body.transcript]),
            int(body.complete),
        ),
    )
    db.commit()
    return _detail(_owned_row(cursor.lastrowid, user.id, db))


@router.get("/{doc_id}", response_model=DocumentDetail)
def get_document(
    doc_id: int,
    user: UserOut = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db),
):
    return _detail(_owned_row(doc_id, user.id, db))


@router.put("/{doc_id}", response_model=DocumentDetail)
def update_document(
    doc_id: int,
    body: DocumentSave,
    user: UserOut = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db),
):
    _owned_row(doc_id, user.id, db)
    db.execute(
        "UPDATE documents SET title = ?, document_type = ?, fields = ?, "
        "transcript = ?, complete = ?, updated_at = datetime('now') "
        "WHERE id = ? AND user_id = ?",
        (
            body.title,
            body.document_type,
            json.dumps([f.model_dump() for f in body.fields]),
            json.dumps([m.model_dump() for m in body.transcript]),
            int(body.complete),
            doc_id,
            user.id,
        ),
    )
    db.commit()
    return _detail(_owned_row(doc_id, user.id, db))


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: int,
    user: UserOut = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db),
):
    _owned_row(doc_id, user.id, db)
    db.execute("DELETE FROM documents WHERE id = ? AND user_id = ?", (doc_id, user.id))
    db.commit()
