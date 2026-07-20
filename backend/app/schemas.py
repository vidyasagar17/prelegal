"""Request and response models for the API."""

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    # bcrypt hashes at most 72 bytes, so cap the password there.
    password: str = Field(min_length=8, max_length=72)


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
