from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models.exercise import Exercise
from app.models.muscle_group import MuscleGroup
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate

router = APIRouter(prefix="/api/v1/exercises", tags=["exercises"])


async def _validate_muscle_group(
    session: AsyncSession, muscle_group_id: int, user_id: int
) -> None:
    """Validate that the muscle group exists, is active, and belongs to the user."""
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == user_id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=400, detail="Invalid muscle group")


@router.get("", response_model=list[ExerciseRead], operation_id="listExercises")
async def list_exercises(
    muscle_group_id: int | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[ExerciseRead]:
    query = select(Exercise).where(
        Exercise.user_id == current_user.id,
        Exercise.is_active == True,  # noqa: E712
    )
    if muscle_group_id is not None:
        query = query.where(Exercise.muscle_group_id == muscle_group_id)
    result = await session.execute(query)
    exercises = result.scalars().all()
    return [ExerciseRead.model_validate(e) for e in exercises]


@router.get("/{exercise_id}", response_model=ExerciseRead, operation_id="getExercise")
async def get_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == current_user.id,
            Exercise.is_active == True,  # noqa: E712
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return ExerciseRead.model_validate(ex)


@router.post(
    "", response_model=ExerciseRead, status_code=201, operation_id="createExercise"
)
async def create_exercise(
    body: ExerciseCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    await _validate_muscle_group(session, body.muscle_group_id, current_user.id)
    existing = await session.execute(
        select(Exercise).where(
            Exercise.user_id == current_user.id,
            Exercise.name == body.name,
            Exercise.is_active == True,  # noqa: E712
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409, detail="Exercise with this name already exists"
        )
    ex = Exercise(
        name=body.name,
        type=body.type,
        muscle_group_id=body.muscle_group_id,
        user_id=current_user.id,
    )
    session.add(ex)
    await session.flush()
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
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == current_user.id,
            Exercise.is_active == True,  # noqa: E712
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    update_data = body.model_dump(exclude_unset=True)
    if "muscle_group_id" in update_data:
        await _validate_muscle_group(
            session, update_data["muscle_group_id"], current_user.id
        )
    if "name" in update_data:
        existing = await session.execute(
            select(Exercise).where(
                Exercise.user_id == current_user.id,
                Exercise.name == update_data["name"],
                Exercise.is_active == True,  # noqa: E712
                Exercise.id != exercise_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=409, detail="Exercise with this name already exists"
            )
    for key, value in update_data.items():
        setattr(ex, key, value)
    await session.flush()
    return ExerciseRead.model_validate(ex)


@router.delete(
    "/{exercise_id}", response_model=MessageResponse, operation_id="deleteExercise"
)
async def delete_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == current_user.id,
            Exercise.is_active == True,  # noqa: E712
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    ex.is_active = False
    await session.flush()
    return MessageResponse(message=f"Exercise '{ex.name}' deactivated")
