from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReferenceError,
    NotFoundError,
)
from app.services.exercise import ExerciseService

router = APIRouter(prefix="/api/v1/exercises", tags=["exercises"])


@router.get("", response_model=list[ExerciseRead], operation_id="listExercises")
async def list_exercises(
    muscle_group_id: int | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[ExerciseRead]:
    svc = ExerciseService(session, current_user.id)
    exercises = await svc.list(muscle_group_id=muscle_group_id)
    return [ExerciseRead.model_validate(e) for e in exercises]


@router.get("/{exercise_id}", response_model=ExerciseRead, operation_id="getExercise")
async def get_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    svc = ExerciseService(session, current_user.id)
    try:
        ex = await svc.get(exercise_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ExerciseRead.model_validate(ex)


@router.post(
    "", response_model=ExerciseRead, status_code=201, operation_id="createExercise"
)
async def create_exercise(
    body: ExerciseCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    svc = ExerciseService(session, current_user.id)
    try:
        ex = await svc.create(body)
    except InvalidReferenceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return ExerciseRead.model_validate(ex)


@router.patch(
    "/{exercise_id}", response_model=ExerciseRead, operation_id="updateExercise"
)
async def update_exercise(
    exercise_id: int,
    body: ExerciseUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    svc = ExerciseService(session, current_user.id)
    try:
        ex = await svc.update(exercise_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidReferenceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return ExerciseRead.model_validate(ex)


@router.delete(
    "/{exercise_id}", response_model=MessageResponse, operation_id="deleteExercise"
)
async def delete_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    svc = ExerciseService(session, current_user.id)
    try:
        ex = await svc.delete(exercise_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message=f"Exercise '{ex.name}' deactivated")
