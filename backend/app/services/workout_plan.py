from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.plan_exercise import PlanExercise
from app.models.workout_plan import WorkoutPlan
from app.models.exercise import Exercise
from app.schemas.workout_plan import PlanExerciseCreate, WorkoutPlanCreate, WorkoutPlanUpdate
from app.services.exceptions import DuplicateNameError, InvalidReferenceError, NotFoundError


class WorkoutPlanService:
    def __init__(self, session: AsyncSession, user_id: int):
        self.session = session
        self.user_id = user_id

    async def list(self) -> list[tuple[WorkoutPlan, list[PlanExercise]]]:
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

        plan_ids = [p.id for p in plans]
        ex_result = await self.session.execute(
            select(PlanExercise)
            .where(PlanExercise.plan_id.in_(plan_ids))
            .order_by(PlanExercise.sort_order)
        )
        all_exercises = list(ex_result.scalars().all())

        exercises_by_plan: dict[int, list[PlanExercise]] = {}
        for ex in all_exercises:
            exercises_by_plan.setdefault(ex.plan_id, []).append(ex)

        return [(p, exercises_by_plan.get(p.id, [])) for p in plans]

    async def get(self, plan_id: int) -> tuple[WorkoutPlan, list[PlanExercise]]:
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

        ex_result = await self.session.execute(
            select(PlanExercise)
            .where(PlanExercise.plan_id == plan.id)
            .order_by(PlanExercise.sort_order)
        )
        exercises = list(ex_result.scalars().all())
        return (plan, exercises)

    async def create(self, data: WorkoutPlanCreate) -> WorkoutPlan:
        await self._check_duplicate_name(data.name)
        plan = WorkoutPlan(
            name=data.name,
            user_id=self.user_id,
        )
        self.session.add(plan)
        await self.session.flush()
        return plan

    async def update(
        self, plan_id: int, data: WorkoutPlanUpdate
    ) -> WorkoutPlan:
        plan, _ = await self.get(plan_id)
        update_data = data.model_dump(exclude_unset=True)
        if "name" in update_data:
            await self._check_duplicate_name(
                update_data["name"], exclude_id=plan_id
            )
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
        self, plan_id: int, data: PlanExerciseCreate
    ) -> PlanExercise:
        plan, _ = await self.get(plan_id)
        await self._validate_exercise(data.exercise_id)
        pe = PlanExercise(
            plan_id=plan.id,
            exercise_id=data.exercise_id,
            sort_order=data.sort_order,
        )
        self.session.add(pe)
        await self.session.flush()
        return pe

    async def remove_exercise(
        self, plan_id: int, plan_exercise_id: int
    ) -> None:
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

    async def _validate_exercise(self, exercise_id: int) -> None:
        result = await self.session.execute(
            select(Exercise).where(
                Exercise.id == exercise_id,
                Exercise.user_id == self.user_id,
                Exercise.is_active == True,  # noqa: E712
            )
        )
        if result.scalar_one_or_none() is None:
            raise InvalidReferenceError("Plan exercise", "exercise_id")

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
