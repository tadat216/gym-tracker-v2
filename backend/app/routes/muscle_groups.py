from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models.muscle_group import MuscleGroup
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.muscle_group import (
    MuscleGroupCreate,
    MuscleGroupRead,
    MuscleGroupUpdate,
)

router = APIRouter(prefix="/api/v1/muscle-groups", tags=["muscle-groups"])


@router.get("", response_model=list[MuscleGroupRead], operation_id="listMuscleGroups")
async def list_muscle_groups(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[MuscleGroupRead]:
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.user_id == current_user.id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    groups = result.scalars().all()
    return [MuscleGroupRead.model_validate(g) for g in groups]


@router.get(
    "/{muscle_group_id}",
    response_model=MuscleGroupRead,
    operation_id="getMuscleGroup",
)
async def get_muscle_group(
    muscle_group_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MuscleGroupRead:
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == current_user.id,
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
    operation_id="createMuscleGroup",
)
async def create_muscle_group(
    body: MuscleGroupCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MuscleGroupRead:
    # Check duplicate name among user's active muscle groups
    existing = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.user_id == current_user.id,
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
        user_id=current_user.id,
    )
    session.add(mg)
    await session.flush()
    return MuscleGroupRead.model_validate(mg)


@router.patch(
    "/{muscle_group_id}",
    response_model=MuscleGroupRead,
    operation_id="updateMuscleGroup",
)
async def update_muscle_group(
    muscle_group_id: int,
    body: MuscleGroupUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MuscleGroupRead:
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == current_user.id,
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
                MuscleGroup.user_id == current_user.id,
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
    operation_id="deleteMuscleGroup",
)
async def delete_muscle_group(
    muscle_group_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == current_user.id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    mg = result.scalar_one_or_none()
    if mg is None:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    mg.is_active = False
    await session.flush()
    return MessageResponse(message=f"Muscle group '{mg.name}' deactivated")
