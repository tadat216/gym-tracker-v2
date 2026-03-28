from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.workout_session import (
    ExerciseSetCreate,
    ExerciseSetRead,
    ExerciseSetUpdate,
    SessionExerciseCreate,
    SessionExerciseRead,
    WorkoutSessionCreate,
    WorkoutSessionRead,
    WorkoutSessionUpdate,
)
from app.services.exceptions import (
    InvalidReferenceError,
    NotFoundError,
)
from app.services.workout_session import WorkoutSessionService

router = APIRouter(prefix="/api/v1/workout-sessions", tags=["workout-sessions"])


def _to_session_read(ws, exercises: list[SessionExerciseRead]) -> WorkoutSessionRead:
    return WorkoutSessionRead(
        id=ws.id,
        plan_id=ws.plan_id,
        date=ws.date,
        status=ws.status,
        notes=ws.notes,
        started_at=ws.started_at,
        completed_at=ws.completed_at,
        exercises=exercises,
    )


@router.get(
    "",
    response_model=list[WorkoutSessionRead],
    operation_id="listWorkoutSessions",
)
async def list_workout_sessions(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[WorkoutSessionRead]:
    svc = WorkoutSessionService(session, current_user.id)
    sessions = await svc.list(date_from=date_from, date_to=date_to)
    return [_to_session_read(ws, exs) for ws, exs in sessions]


@router.post(
    "",
    response_model=WorkoutSessionRead,
    status_code=201,
    operation_id="createWorkoutSession",
)
async def create_workout_session(
    body: WorkoutSessionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> WorkoutSessionRead:
    svc = WorkoutSessionService(session, current_user.id)
    try:
        ws = await svc.create(body)
    except InvalidReferenceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    ws, exercises = await svc.get(ws.id)
    return _to_session_read(ws, exercises)


@router.get(
    "/{session_id}",
    response_model=WorkoutSessionRead,
    operation_id="getWorkoutSession",
)
async def get_workout_session(
    session_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> WorkoutSessionRead:
    svc = WorkoutSessionService(session, current_user.id)
    try:
        ws, exercises = await svc.get(session_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _to_session_read(ws, exercises)


@router.patch(
    "/{session_id}",
    response_model=WorkoutSessionRead,
    operation_id="updateWorkoutSession",
)
async def update_workout_session(
    session_id: int,
    body: WorkoutSessionUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> WorkoutSessionRead:
    svc = WorkoutSessionService(session, current_user.id)
    try:
        ws = await svc.update(session_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    _, exercises = await svc.get(session_id)
    return _to_session_read(ws, exercises)


@router.delete(
    "/{session_id}",
    response_model=MessageResponse,
    operation_id="deleteWorkoutSession",
)
async def delete_workout_session(
    session_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    svc = WorkoutSessionService(session, current_user.id)
    try:
        await svc.delete(session_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message="Workout session deleted")


@router.patch(
    "/{session_id}/complete",
    response_model=WorkoutSessionRead,
    operation_id="completeWorkoutSession",
)
async def complete_workout_session(
    session_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> WorkoutSessionRead:
    svc = WorkoutSessionService(session, current_user.id)
    try:
        ws = await svc.complete(session_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    _, exercises = await svc.get(session_id)
    return _to_session_read(ws, exercises)


@router.post(
    "/{session_id}/exercises",
    response_model=SessionExerciseRead,
    status_code=201,
    operation_id="addSessionExercise",
)
async def add_session_exercise(
    session_id: int,
    body: SessionExerciseCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> SessionExerciseRead:
    svc = WorkoutSessionService(session, current_user.id)
    try:
        se = await svc.add_exercise(session_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidReferenceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return se


@router.delete(
    "/{session_id}/exercises/{session_exercise_id}",
    response_model=MessageResponse,
    operation_id="removeSessionExercise",
)
async def remove_session_exercise(
    session_id: int,
    session_exercise_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    svc = WorkoutSessionService(session, current_user.id)
    try:
        await svc.remove_exercise(session_id, session_exercise_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message="Exercise removed from session")


@router.post(
    "/{session_id}/exercises/{session_exercise_id}/sets",
    response_model=ExerciseSetRead,
    status_code=201,
    operation_id="addExerciseSet",
)
async def add_exercise_set(
    session_id: int,
    session_exercise_id: int,
    body: ExerciseSetCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseSetRead:
    svc = WorkoutSessionService(session, current_user.id)
    try:
        es = await svc.add_set(session_id, session_exercise_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return es


@router.patch(
    "/{session_id}/exercises/{session_exercise_id}/sets/{set_id}",
    response_model=ExerciseSetRead,
    operation_id="updateExerciseSet",
)
async def update_exercise_set(
    session_id: int,
    session_exercise_id: int,
    set_id: int,
    body: ExerciseSetUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseSetRead:
    svc = WorkoutSessionService(session, current_user.id)
    try:
        es = await svc.update_set(session_id, session_exercise_id, set_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return es


@router.delete(
    "/{session_id}/exercises/{session_exercise_id}/sets/{set_id}",
    response_model=MessageResponse,
    operation_id="deleteExerciseSet",
)
async def delete_exercise_set(
    session_id: int,
    session_exercise_id: int,
    set_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    svc = WorkoutSessionService(session, current_user.id)
    try:
        await svc.delete_set(session_id, session_exercise_id, set_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message="Set deleted")
