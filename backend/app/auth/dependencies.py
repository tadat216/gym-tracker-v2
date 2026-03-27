from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.jwt import decode_access_token
from app.database import get_session
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    payload = decode_access_token(token)
    user = await session.get(User, payload.sub)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if user.is_system:
        raise HTTPException(status_code=403, detail="System user cannot access API")
    return user


async def get_current_admin(
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def get_system_user(
    session: AsyncSession = Depends(get_session),
) -> User:
    result = await session.execute(
        select(User).where(User.is_system == True)  # noqa: E712
    )
    system_user = result.scalar_one_or_none()
    if system_user is None:
        raise HTTPException(status_code=500, detail="System user not found")
    return system_user
