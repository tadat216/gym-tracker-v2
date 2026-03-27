from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.dependencies import get_current_admin
from app.database import get_session
from app.models.muscle_group import MuscleGroup
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.muscle_group import (
    MuscleGroupCreate,
    MuscleGroupRead,
    MuscleGroupUpdate,
)

router = APIRouter(prefix="/api/v1/admin/muscle-groups", tags=["admin-muscle-groups"])


async def _get_system_user(session: AsyncSession) -> User:
    result = await session.execute(
        select(User).where(User.is_system == True)  # noqa: E712
    )
    system_user = result.scalar_one_or_none()
    if system_user is None:
        raise HTTPException(status_code=500, detail="System user not found")
    return system_user


@router.get(
    "", response_model=list[MuscleGroupRead], operation_id="adminListMuscleGroups"
)
async def admin_list_muscle_groups(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> list[MuscleGroupRead]:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.user_id == system_user.id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    groups = result.scalars().all()
    return [MuscleGroupRead.model_validate(g) for g in groups]


@router.get(
    "/{muscle_group_id}",
    response_model=MuscleGroupRead,
    operation_id="adminGetMuscleGroup",
)
async def admin_get_muscle_group(
    muscle_group_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> MuscleGroupRead:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == system_user.id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    mg = result.scalar_one_or_none()
    if mg is None:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    return MuscleGroupRead.model_validate(mg)


@router.post(
    "",
    response_model=MuscleGroupRead,
    status_code=201,
    operation_id="adminCreateMuscleGroup",
)
async def admin_create_muscle_group(
    body: MuscleGroupCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> MuscleGroupRead:
    system_user = await _get_system_user(session)
    existing = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.user_id == system_user.id,
            MuscleGroup.name == body.name,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409, detail="Muscle group with this name already exists"
        )
    mg = MuscleGroup(
        name=body.name,
        color=body.color,
        user_id=system_user.id,
    )
    session.add(mg)
    await session.flush()
    return MuscleGroupRead.model_validate(mg)


@router.patch(
    "/{muscle_group_id}",
    response_model=MuscleGroupRead,
    operation_id="adminUpdateMuscleGroup",
)
async def admin_update_muscle_group(
    muscle_group_id: int,
    body: MuscleGroupUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> MuscleGroupRead:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == system_user.id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    mg = result.scalar_one_or_none()
    if mg is None:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    update_data = body.model_dump(exclude_unset=True)
    if "name" in update_data:
        existing = await session.execute(
            select(MuscleGroup).where(
                MuscleGroup.user_id == system_user.id,
                MuscleGroup.name == update_data["name"],
                MuscleGroup.is_active == True,  # noqa: E712
                MuscleGroup.id != muscle_group_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=409,
                detail="Muscle group with this name already exists",
            )
    for key, value in update_data.items():
        setattr(mg, key, value)
    await session.flush()
    return MuscleGroupRead.model_validate(mg)


@router.delete(
    "/{muscle_group_id}",
    response_model=MessageResponse,
    operation_id="adminDeleteMuscleGroup",
)
async def admin_delete_muscle_group(
    muscle_group_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> MessageResponse:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == system_user.id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    mg = result.scalar_one_or_none()
    if mg is None:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    mg.is_active = False
    await session.flush()
    return MessageResponse(message=f"Muscle group '{mg.name}' deactivated")
