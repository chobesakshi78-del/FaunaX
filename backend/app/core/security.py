"""
FAUNA-X: Security & Authentication Utilities
Password hashing, JWT generation, and role-based access control decorators.
"""
from datetime import datetime, timedelta
from typing import Optional, Any, Union
import bcrypt
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from backend.app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pw_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"sub": str(subject), "role": role, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user_token(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None:
            raise credentials_exception
        return {"user_id": int(user_id), "role": role}
    except JWTError:
        raise credentials_exception

def require_roles(allowed_roles: list):
    """Dependency that enforces role-based authorization."""
    async def role_checker(token_data: dict = Depends(get_current_user_token)):
        user_role = token_data.get("role", "").upper()
        # Admin and National Admin have root bypass
        if user_role in ["ADMIN", "NATIONAL_ADMIN"]:
            return token_data
        
        normalized_allowed = [r.upper() for r in allowed_roles]
        if user_role not in normalized_allowed:
            # Also allow GOVERNMENT to match DISTRICT_ADMIN / STATE_ADMIN
            if user_role == "GOVERNMENT" and any(r in ["DISTRICT_ADMIN", "STATE_ADMIN", "NATIONAL_ADMIN"] for r in normalized_allowed):
                return token_data
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden for role '{user_role}'. Required roles: {allowed_roles}"
            )
        return token_data
    return role_checker
