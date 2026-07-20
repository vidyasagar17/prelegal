"""Sign up, sign in, sign out, and current-user endpoints.

The JWT session token is stored in an HttpOnly cookie so the browser sends it
automatically and JavaScript cannot read it.
"""

import sqlite3

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from ..config import settings
from ..db import get_db
from ..schemas import SigninRequest, SignupRequest, UserOut
from ..security import create_token, decode_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )


def get_current_user(
    request: Request, db: sqlite3.Connection = Depends(get_db)
) -> UserOut:
    token = request.cookies.get(settings.cookie_name)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )
    row = db.execute(
        "SELECT id, email FROM users WHERE id = ?", (int(payload["sub"]),)
    ).fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    return UserOut(id=row["id"], email=row["email"])


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(
    body: SignupRequest,
    response: Response,
    db: sqlite3.Connection = Depends(get_db),
):
    email = body.email.lower()
    if db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )
    cursor = db.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        (email, hash_password(body.password)),
    )
    db.commit()
    user_id = cursor.lastrowid
    _set_auth_cookie(response, create_token(user_id, email))
    return UserOut(id=user_id, email=email)


@router.post("/signin", response_model=UserOut)
def signin(
    body: SigninRequest,
    response: Response,
    db: sqlite3.Connection = Depends(get_db),
):
    email = body.email.lower()
    row = db.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?", (email,)
    ).fetchone()
    if row is None or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    _set_auth_cookie(response, create_token(row["id"], row["email"]))
    return UserOut(id=row["id"], email=row["email"])


@router.post("/signout")
def signout(response: Response):
    response.delete_cookie(settings.cookie_name, path="/")
    return {"detail": "Signed out"}


@router.get("/me", response_model=UserOut)
def me(user: UserOut = Depends(get_current_user)):
    return user
