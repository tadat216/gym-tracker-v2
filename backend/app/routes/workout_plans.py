from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.workout_plan import (
    PlanExerciseCreate,
    PlanExerciseRead,
    PlanExerciseReorder,
    WorkoutPlanCreate,
    WorkoutPlanRead,
    WorkoutPlanUpdate,
)
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReferenceError,
    InvalidReorderError,
    NotFoundError,
)
from app.services.workout_plan import WorkoutPlanService

router = APIRouter(prefix="/api/v1/workout-plans", tags=["workout-plans"])


def _to_plan_read(plan, exercises) -> WorkoutPlanRead:
    return WorkoutPlanRead(
        id=plan.id,
        name=plan.name,
        is_active=plan.is_active,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        exercises=[PlanExerciseRead.model_validate(e) for e in exercises],
    )


@router.get("", response_model=list[WorkoutPlanRead], operation_id="listWorkoutPlans")
async def list_workout_plans(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[WorkoutPlanRead]:
    svc = WorkoutPlanService(session, current_user.id)
    plans = await svc.list()
    return [_to_plan_read(p, exs) for p, exs in plans]


@router.get(
    "/{plan_id}",
    response_model=WorkoutPlanRead,
    operation_id="getWorkoutPlan",
)
async def get_workout_plan(
    plan_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> WorkoutPlanRead:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        plan, exercises = await svc.get(plan_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _to_plan_read(plan, exercises)


@router.post(
    "",
    response_model=WorkoutPlanRead,
    status_code=201,
    operation_id="createWorkoutPlan",
)
async def create_workout_plan(
    body: WorkoutPlanCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> WorkoutPlanRead:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        plan = await svc.create(body)
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return _to_plan_read(plan, [])


@router.patch(
    "/{plan_id}",
    response_model=WorkoutPlanRead,
    operation_id="updateWorkoutPlan",
)
async def update_workout_plan(
    plan_id: int,
    body: WorkoutPlanUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> WorkoutPlanRead:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        plan = await svc.update(plan_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except DuplicateNameError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    _, exercises = await svc.get(plan_id)
    return _to_plan_read(plan, exercises)


@router.delete(
    "/{plan_id}",
    response_model=MessageResponse,
    operation_id="deleteWorkoutPlan",
)
async def delete_workout_plan(
    plan_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        plan = await svc.delete(plan_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message=f"Workout plan '{plan.name}' deactivated")


@router.post(
    "/{plan_id}/exercises",
    response_model=PlanExerciseRead,
    status_code=201,
    operation_id="addPlanExercise",
)
async def add_plan_exercise(
    plan_id: int,
    body: PlanExerciseCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PlanExerciseRead:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        pe = await svc.add_exercise(plan_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidReferenceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return PlanExerciseRead.model_validate(pe)


@router.patch(
    "/{plan_id}/exercises/reorder",
    response_model=MessageResponse,
    operation_id="reorderPlanExercises",
)
async def reorder_plan_exercises(
    plan_id: int,
    body: PlanExerciseReorder,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        await svc.reorder_exercises(plan_id, body)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidReorderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return MessageResponse(message="Exercises reordered")


@router.delete(
    "/{plan_id}/exercises/{plan_exercise_id}",
    response_model=MessageResponse,
    operation_id="removePlanExercise",
)
async def remove_plan_exercise(
    plan_id: int,
    plan_exercise_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    svc = WorkoutPlanService(session, current_user.id)
    try:
        await svc.remove_exercise(plan_id, plan_exercise_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message="Exercise removed from plan")
