from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.exercise import Exercise
from app.models.muscle_group import MuscleGroup
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReferenceError,
    NotFoundError,
)


class ExerciseService:
    def __init__(self, session: AsyncSession, user_id: int):
        self.session = session
        self.user_id = user_id

    async def list(self, muscle_group_id: int | None = None) -> list[Exercise]:
        query = (
            select(Exercise)
            .where(
                Exercise.user_id == self.user_id,
                Exercise.is_active == True,  # noqa: E712
            )
            .order_by(Exercise.name)
        )
        if muscle_group_id is not None:
            query = query.where(Exercise.muscle_group_id == muscle_group_id)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get(self, exercise_id: int) -> Exercise:
        result = await self.session.execute(
            select(Exercise).where(
                Exercise.id == exercise_id,
                Exercise.user_id == self.user_id,
                Exercise.is_active == True,  # noqa: E712
            )
        )
        ex = result.scalar_one_or_none()
        if ex is None:
            raise NotFoundError("Exercise")
        return ex

    async def create(self, data: ExerciseCreate) -> Exercise:
        await self._validate_muscle_group(data.muscle_group_id)
        await self._check_duplicate_name(data.name)
        ex = Exercise(
            name=data.name,
            type=data.type,
            muscle_group_id=data.muscle_group_id,
            user_id=self.user_id,
        )
        self.session.add(ex)
        await self.session.flush()
        return ex

    async def update(self, exercise_id: int, data: ExerciseUpdate) -> Exercise:
        ex = await self.get(exercise_id)
        update_data = data.model_dump(exclude_unset=True)
        if "muscle_group_id" in update_data:
            await self._validate_muscle_group(update_data["muscle_group_id"])
        if "name" in update_data:
            await self._check_duplicate_name(
                update_data["name"], exclude_id=exercise_id
            )
        for key, value in update_data.items():
            setattr(ex, key, value)
        await self.session.flush()
        return ex

    async def delete(self, exercise_id: int) -> Exercise:
        ex = await self.get(exercise_id)
        ex.is_active = False
        await self.session.flush()
        return ex

    async def _validate_muscle_group(self, muscle_group_id: int) -> None:
        result = await self.session.execute(
            select(MuscleGroup).where(
                MuscleGroup.id == muscle_group_id,
                MuscleGroup.user_id == self.user_id,
                MuscleGroup.is_active == True,  # noqa: E712
            )
        )
        if result.scalar_one_or_none() is None:
            raise InvalidReferenceError("Exercise", "muscle_group_id")

    async def _check_duplicate_name(
        self, name: str, *, exclude_id: int | None = None
    ) -> None:
        query = select(Exercise).where(
            Exercise.user_id == self.user_id,
            Exercise.name == name,
            Exercise.is_active == True,  # noqa: E712
        )
        if exclude_id is not None:
            query = query.where(Exercise.id != exclude_id)
        result = await self.session.execute(query)
        if result.scalar_one_or_none() is not None:
            raise DuplicateNameError("Exercise", name)
