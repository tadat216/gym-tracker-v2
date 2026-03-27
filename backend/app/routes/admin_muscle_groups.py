from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin, get_system_user
from app.database import get_session
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.muscle_group import (
    MuscleGroupCreate,
    MuscleGroupRead,
    MuscleGroupUpdate,
)
from app.services.exceptions import DuplicateNameError, NotFoundError
from app.services.muscle_group import MuscleGroupService

router = APIRouter(prefix="/api/v1/admin/muscle-groups", tags=["admin-muscle-groups"])


@router.get(
    "", response_model=list[MuscleGroupRead], operation_id="adminListMuscleGroups"
)
async def admin_list_muscle_groups(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
    system_user: User = Depends(get_system_user),
) -> list[MuscleGroupRead]:
    svc = MuscleGroupService(session, system_user.id)
    groups = await svc.list()
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
    system_user: User = Depends(get_system_user),
) -> MuscleGroupRead:
    svc = MuscleGroupService(session, system_user.id)
    try:
        mg = await svc.get(muscle_group_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
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
    system_user: User = Depends(get_system_user),
) -> MuscleGroupRead:
    svc = MuscleGroupService(session, system_user.id)
    try:
        mg = await svc.create(body)
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
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
    system_user: User = Depends(get_system_user),
) -> MuscleGroupRead:
    svc = MuscleGroupService(session, system_user.id)
    try:
        mg = await svc.update(muscle_group_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
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
    system_user: User = Depends(get_system_user),
) -> MessageResponse:
    svc = MuscleGroupService(session, system_user.id)
    try:
        mg = await svc.delete(muscle_group_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message=f"Muscle group '{mg.name}' deactivated")
