from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.dependencies import get_current_admin
from app.database import get_session
from app.models.exercise import Exercise
from app.models.muscle_group import MuscleGroup
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate

router = APIRouter(prefix="/api/v1/admin/exercises", tags=["admin-exercises"])


async def _get_system_user(session: AsyncSession) -> User:
    result = await session.execute(
        select(User).where(User.is_system == True)  # noqa: E712
    )
    system_user = result.scalar_one_or_none()
    if system_user is None:
        raise HTTPException(status_code=500, detail="System user not found")
    return system_user


async def _validate_system_muscle_group(
    session: AsyncSession, muscle_group_id: int, system_user_id: int
) -> None:
    result = await session.execute(
        select(MuscleGroup).where(
            MuscleGroup.id == muscle_group_id,
            MuscleGroup.user_id == system_user_id,
            MuscleGroup.is_active == True,  # noqa: E712
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=400, detail="Invalid muscle group")


@router.get("", response_model=list[ExerciseRead], operation_id="adminListExercises")
async def admin_list_exercises(
    muscle_group_id: int | None = None,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> list[ExerciseRead]:
    system_user = await _get_system_user(session)
    query = select(Exercise).where(
        Exercise.user_id == system_user.id,
        Exercise.is_active == True,  # noqa: E712
    )
    if muscle_group_id is not None:
        query = query.where(Exercise.muscle_group_id == muscle_group_id)
    result = await session.execute(query)
    exercises = result.scalars().all()
    return [ExerciseRead.model_validate(e) for e in exercises]


@router.get(
    "/{exercise_id}",
    response_model=ExerciseRead,
    operation_id="adminGetExercise",
)
async def admin_get_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> ExerciseRead:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == system_user.id,
            Exercise.is_active == True,  # noqa: E712
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return ExerciseRead.model_validate(ex)


@router.post(
    "",
    response_model=ExerciseRead,
    status_code=201,
    operation_id="adminCreateExercise",
)
async def admin_create_exercise(
    body: ExerciseCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> ExerciseRead:
    system_user = await _get_system_user(session)
    await _validate_system_muscle_group(session, body.muscle_group_id, system_user.id)
    existing = await session.execute(
        select(Exercise).where(
            Exercise.user_id == system_user.id,
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
        user_id=system_user.id,
    )
    session.add(ex)
    await session.flush()
    return ExerciseRead.model_validate(ex)


@router.patch(
    "/{exercise_id}",
    response_model=ExerciseRead,
    operation_id="adminUpdateExercise",
)
async def admin_update_exercise(
    exercise_id: int,
    body: ExerciseUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> ExerciseRead:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == system_user.id,
            Exercise.is_active == True,  # noqa: E712
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    update_data = body.model_dump(exclude_unset=True)
    if "muscle_group_id" in update_data:
        await _validate_system_muscle_group(
            session, update_data["muscle_group_id"], system_user.id
        )
    if "name" in update_data:
        existing = await session.execute(
            select(Exercise).where(
                Exercise.user_id == system_user.id,
                Exercise.name == update_data["name"],
                Exercise.is_active == True,  # noqa: E712
                Exercise.id != exercise_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=409,
                detail="Exercise with this name already exists",
            )
    for key, value in update_data.items():
        setattr(ex, key, value)
    await session.flush()
    return ExerciseRead.model_validate(ex)


@router.delete(
    "/{exercise_id}",
    response_model=MessageResponse,
    operation_id="adminDeleteExercise",
)
async def admin_delete_exercise(
    exercise_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_admin),
) -> MessageResponse:
    system_user = await _get_system_user(session)
    result = await session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == system_user.id,
            Exercise.is_active == True,  # noqa: E712
        )
    )
    ex = result.scalar_one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    ex.is_active = False
    await session.flush()
    return MessageResponse(message=f"Exercise '{ex.name}' deactivated")
