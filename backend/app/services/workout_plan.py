from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.exercise import Exercise
from app.models.muscle_group import MuscleGroup
from app.models.plan_exercise import PlanExercise
from app.models.workout_plan import WorkoutPlan
from app.schemas.workout_plan import (
    PlanExerciseCreate,
    PlanExerciseRead,
    PlanExerciseReorder,
    WorkoutPlanCreate,
    WorkoutPlanUpdate,
)
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReferenceError,
    InvalidReorderError,
    NotFoundError,
)


class WorkoutPlanService:
    def __init__(self, session: AsyncSession, user_id: int):
        self.session = session
        self.user_id = user_id

    async def _fetch_enriched_exercises(
        self,
        plan_ids: list[int],
    ) -> dict[int, list[PlanExerciseRead]]:
        if not plan_ids:
            return {}
        result = await self.session.execute(
            select(
                PlanExercise.id,
                PlanExercise.plan_id,
                PlanExercise.exercise_id,
                PlanExercise.sort_order,
                Exercise.name.label("exercise_name"),
                MuscleGroup.name.label("muscle_group_name"),
            )
            .join(Exercise, PlanExercise.exercise_id == Exercise.id)
            .join(MuscleGroup, Exercise.muscle_group_id == MuscleGroup.id)
            .where(PlanExercise.plan_id.in_(plan_ids))
            .order_by(PlanExercise.sort_order)
        )
        rows = result.all()
        by_plan: dict[int, list[PlanExerciseRead]] = {}
        for row in rows:
            by_plan.setdefault(row.plan_id, []).append(
                PlanExerciseRead(
                    id=row.id,
                    exercise_id=row.exercise_id,
                    sort_order=row.sort_order,
                    exercise_name=row.exercise_name,
                    muscle_group_name=row.muscle_group_name,
                )
            )
        return by_plan

    async def list(self) -> list[tuple[WorkoutPlan, list[PlanExerciseRead]]]:
        result = await self.session.execute(
            select(WorkoutPlan)
            .where(
                WorkoutPlan.user_id == self.user_id,
                WorkoutPlan.is_active == True,  # noqa: E712
            )
            .order_by(WorkoutPlan.updated_at.desc())
        )
        plans = list(result.scalars().all())
        if not plans:
            return []

        exercises_by_plan = await self._fetch_enriched_exercises([p.id for p in plans])
        return [(p, exercises_by_plan.get(p.id, [])) for p in plans]

    async def get(
        self,
        plan_id: int,
    ) -> tuple[WorkoutPlan, list[PlanExerciseRead]]:
        result = await self.session.execute(
            select(WorkoutPlan).where(
                WorkoutPlan.id == plan_id,
                WorkoutPlan.user_id == self.user_id,
                WorkoutPlan.is_active == True,  # noqa: E712
            )
        )
        plan = result.scalar_one_or_none()
        if plan is None:
            raise NotFoundError("Workout plan")

        exercises_by_plan = await self._fetch_enriched_exercises([plan.id])
        return (plan, exercises_by_plan.get(plan.id, []))

    async def create(self, data: WorkoutPlanCreate) -> WorkoutPlan:
        await self._check_duplicate_name(data.name)
        plan = WorkoutPlan(
            name=data.name,
            user_id=self.user_id,
        )
        self.session.add(plan)
        await self.session.flush()
        return plan

    async def update(self, plan_id: int, data: WorkoutPlanUpdate) -> WorkoutPlan:
        plan, _ = await self.get(plan_id)
        update_data = data.model_dump(exclude_unset=True)
        if "name" in update_data:
            await self._check_duplicate_name(update_data["name"], exclude_id=plan_id)
        for key, value in update_data.items():
            setattr(plan, key, value)
        plan.updated_at = datetime.now(UTC)
        await self.session.flush()
        return plan

    async def delete(self, plan_id: int) -> WorkoutPlan:
        plan, _ = await self.get(plan_id)
        plan.is_active = False
        await self.session.flush()
        return plan

    async def add_exercise(
        self,
        plan_id: int,
        data: PlanExerciseCreate,
    ) -> PlanExerciseRead:
        plan, _ = await self.get(plan_id)
        exercise = await self._validate_exercise(data.exercise_id)
        pe = PlanExercise(
            plan_id=plan.id,
            exercise_id=data.exercise_id,
            sort_order=data.sort_order,
        )
        self.session.add(pe)
        await self.session.flush()
        mg_result = await self.session.execute(
            select(MuscleGroup.name).where(MuscleGroup.id == exercise.muscle_group_id)
        )
        return PlanExerciseRead(
            id=pe.id,
            exercise_id=pe.exercise_id,
            sort_order=pe.sort_order,
            exercise_name=exercise.name,
            muscle_group_name=mg_result.scalar_one(),
        )

    async def remove_exercise(self, plan_id: int, plan_exercise_id: int) -> None:
        await self.get(plan_id)
        result = await self.session.execute(
            select(PlanExercise).where(
                PlanExercise.id == plan_exercise_id,
                PlanExercise.plan_id == plan_id,
            )
        )
        pe = result.scalar_one_or_none()
        if pe is None:
            raise NotFoundError("Plan exercise")
        await self.session.delete(pe)
        await self.session.flush()

    async def reorder_exercises(
        self,
        plan_id: int,
        data: PlanExerciseReorder,
    ) -> None:
        # Fetch raw PlanExercise models for reorder (need ORM objects to mutate)
        result = await self.session.execute(
            select(WorkoutPlan).where(
                WorkoutPlan.id == plan_id,
                WorkoutPlan.user_id == self.user_id,
                WorkoutPlan.is_active == True,  # noqa: E712
            )
        )
        if result.scalar_one_or_none() is None:
            raise NotFoundError("Workout plan")

        ex_result = await self.session.execute(
            select(PlanExercise).where(PlanExercise.plan_id == plan_id)
        )
        exercises = list(ex_result.scalars().all())

        current_ids = {e.id for e in exercises}
        new_ids = set(data.plan_exercise_ids)
        if current_ids != new_ids:
            raise InvalidReorderError("plan exercise")

        id_to_exercise = {e.id: e for e in exercises}
        for order, pe_id in enumerate(data.plan_exercise_ids):
            id_to_exercise[pe_id].sort_order = order
        await self.session.flush()

    async def _validate_exercise(self, exercise_id: int) -> Exercise:
        result = await self.session.execute(
            select(Exercise).where(
                Exercise.id == exercise_id,
                Exercise.user_id == self.user_id,
                Exercise.is_active == True,  # noqa: E712
            )
        )
        exercise = result.scalar_one_or_none()
        if exercise is None:
            raise InvalidReferenceError("Plan exercise", "exercise_id")
        return exercise

    async def _check_duplicate_name(
        self, name: str, *, exclude_id: int | None = None
    ) -> None:
        query = select(WorkoutPlan).where(
            WorkoutPlan.user_id == self.user_id,
            WorkoutPlan.name == name,
            WorkoutPlan.is_active == True,  # noqa: E712
        )
        if exclude_id is not None:
            query = query.where(WorkoutPlan.id != exclude_id)
        result = await self.session.execute(query)
        if result.scalar_one_or_none() is not None:
            raise DuplicateNameError("Workout plan", name)
