from __future__ import annotations

from datetime import UTC, date, datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.exercise import Exercise
from app.models.exercise_set import ExerciseSet
from app.models.muscle_group import MuscleGroup
from app.models.plan_exercise import PlanExercise
from app.models.session_exercise import SessionExercise
from app.models.workout_plan import WorkoutPlan
from app.models.workout_session import SessionStatus, WorkoutSession
from app.schemas.workout_session import (
    ExerciseSetCreate,
    ExerciseSetRead,
    ExerciseSetUpdate,
    SessionExerciseCreate,
    SessionExerciseRead,
    WorkoutSessionCreate,
    WorkoutSessionUpdate,
)
from app.services.exceptions import InvalidReferenceError, NotFoundError


class WorkoutSessionService:
    def __init__(self, session: AsyncSession, user_id: int):
        self.session = session
        self.user_id = user_id

    async def _get_session(self, session_id: int) -> WorkoutSession:
        result = await self.session.execute(
            select(WorkoutSession).where(
                WorkoutSession.id == session_id,
                WorkoutSession.user_id == self.user_id,
            )
        )
        ws = result.scalar_one_or_none()
        if ws is None:
            raise NotFoundError("Workout session")
        return ws

    async def _get_session_exercise(
        self,
        session_exercise_id: int,
        session_id: int,
    ) -> SessionExercise:
        result = await self.session.execute(
            select(SessionExercise).where(
                SessionExercise.id == session_exercise_id,
                SessionExercise.session_id == session_id,
            )
        )
        se = result.scalar_one_or_none()
        if se is None:
            raise NotFoundError("Session exercise")
        return se

    async def _fetch_enriched_exercises(
        self,
        session_ids: list[int],
    ) -> dict[int, list[SessionExerciseRead]]:
        if not session_ids:
            return {}

        # Fetch session exercises with exercise + muscle group info
        result = await self.session.execute(
            select(
                SessionExercise.id,
                SessionExercise.session_id,
                SessionExercise.exercise_id,
                SessionExercise.sort_order,
                Exercise.name.label("exercise_name"),
                MuscleGroup.name.label("muscle_group_name"),
            )
            .join(Exercise, SessionExercise.exercise_id == Exercise.id)
            .join(MuscleGroup, Exercise.muscle_group_id == MuscleGroup.id)
            .where(SessionExercise.session_id.in_(session_ids))
            .order_by(SessionExercise.sort_order)
        )
        rows = result.all()

        if not rows:
            return {}

        # Fetch all sets for these session exercises
        se_ids = [row.id for row in rows]
        sets_result = await self.session.execute(
            select(ExerciseSet)
            .where(ExerciseSet.session_exercise_id.in_(se_ids))
            .order_by(ExerciseSet.set_number)
        )
        all_sets = sets_result.scalars().all()

        sets_by_se: dict[int, list[ExerciseSetRead]] = {}
        for s in all_sets:
            sets_by_se.setdefault(s.session_exercise_id, []).append(
                ExerciseSetRead(
                    id=s.id,
                    set_number=s.set_number,
                    reps=s.reps,
                    weight=s.weight,
                    duration=s.duration,
                    is_completed=s.is_completed,
                )
            )

        by_session: dict[int, list[SessionExerciseRead]] = {}
        for row in rows:
            sets = sets_by_se.get(row.id, [])
            is_completed = len(sets) > 0 and all(s.is_completed for s in sets)
            by_session.setdefault(row.session_id, []).append(
                SessionExerciseRead(
                    id=row.id,
                    exercise_id=row.exercise_id,
                    sort_order=row.sort_order,
                    exercise_name=row.exercise_name,
                    muscle_group_name=row.muscle_group_name,
                    sets=sets,
                    is_completed=is_completed,
                )
            )
        return by_session

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
            raise InvalidReferenceError("Session exercise", "exercise_id")
        return exercise

    async def list(
        self,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> list[tuple[WorkoutSession, list[SessionExerciseRead]]]:
        query = select(WorkoutSession).where(
            WorkoutSession.user_id == self.user_id,
        )
        if date_from is not None:
            query = query.where(WorkoutSession.date >= date_from)
        if date_to is not None:
            query = query.where(WorkoutSession.date <= date_to)
        query = query.order_by(WorkoutSession.started_at.desc())

        result = await self.session.execute(query)
        sessions = list(result.scalars().all())
        if not sessions:
            return []

        exercises_by_session = await self._fetch_enriched_exercises(
            [s.id for s in sessions]
        )
        return [(s, exercises_by_session.get(s.id, [])) for s in sessions]

    async def get(
        self,
        session_id: int,
    ) -> tuple[WorkoutSession, list[SessionExerciseRead]]:
        ws = await self._get_session(session_id)
        exercises_by_session = await self._fetch_enriched_exercises([ws.id])
        return (ws, exercises_by_session.get(ws.id, []))

    async def create(self, data: WorkoutSessionCreate) -> WorkoutSession:
        if data.plan_id is not None:
            result = await self.session.execute(
                select(WorkoutPlan).where(
                    WorkoutPlan.id == data.plan_id,
                    WorkoutPlan.user_id == self.user_id,
                    WorkoutPlan.is_active == True,  # noqa: E712
                )
            )
            plan = result.scalar_one_or_none()
            if plan is None:
                raise InvalidReferenceError("Workout session", "plan_id")

        ws = WorkoutSession(
            user_id=self.user_id,
            plan_id=data.plan_id,
            date=data.date or date.today(),
            status=SessionStatus.IN_PROGRESS,
            notes=data.notes,
        )
        self.session.add(ws)
        await self.session.flush()

        # Copy plan exercises into session exercises
        if data.plan_id is not None:
            pe_result = await self.session.execute(
                select(PlanExercise)
                .where(PlanExercise.plan_id == data.plan_id)
                .order_by(PlanExercise.sort_order)
            )
            plan_exercises = pe_result.scalars().all()
            for pe in plan_exercises:
                se = SessionExercise(
                    session_id=ws.id,
                    exercise_id=pe.exercise_id,
                    sort_order=pe.sort_order,
                )
                self.session.add(se)
            await self.session.flush()

        return ws

    async def update(
        self,
        session_id: int,
        data: WorkoutSessionUpdate,
    ) -> WorkoutSession:
        ws = await self._get_session(session_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(ws, key, value)
        await self.session.flush()
        return ws

    async def delete(self, session_id: int) -> None:
        ws = await self._get_session(session_id)

        # Delete all sets for this session's exercises
        se_result = await self.session.execute(
            select(SessionExercise).where(SessionExercise.session_id == ws.id)
        )
        session_exercises = list(se_result.scalars().all())
        if session_exercises:
            se_ids = [se.id for se in session_exercises]
            sets_result = await self.session.execute(
                select(ExerciseSet).where(ExerciseSet.session_exercise_id.in_(se_ids))
            )
            for s in sets_result.scalars().all():
                await self.session.delete(s)

            for se in session_exercises:
                await self.session.delete(se)

        await self.session.delete(ws)
        await self.session.flush()

    async def complete(self, session_id: int) -> WorkoutSession:
        ws = await self._get_session(session_id)
        ws.status = SessionStatus.COMPLETED
        ws.completed_at = datetime.now(UTC)
        await self.session.flush()
        return ws

    async def add_exercise(
        self,
        session_id: int,
        data: SessionExerciseCreate,
    ) -> SessionExerciseRead:
        ws = await self._get_session(session_id)
        exercise = await self._validate_exercise(data.exercise_id)
        se = SessionExercise(
            session_id=ws.id,
            exercise_id=data.exercise_id,
            sort_order=data.sort_order,
        )
        self.session.add(se)
        await self.session.flush()
        mg_result = await self.session.execute(
            select(MuscleGroup.name).where(MuscleGroup.id == exercise.muscle_group_id)
        )
        return SessionExerciseRead(
            id=se.id,
            exercise_id=se.exercise_id,
            sort_order=se.sort_order,
            exercise_name=exercise.name,
            muscle_group_name=mg_result.scalar_one(),
            sets=[],
            is_completed=False,
        )

    async def remove_exercise(
        self,
        session_id: int,
        session_exercise_id: int,
    ) -> None:
        await self._get_session(session_id)
        se = await self._get_session_exercise(session_exercise_id, session_id)

        # Delete sets first
        sets_result = await self.session.execute(
            select(ExerciseSet).where(
                ExerciseSet.session_exercise_id == se.id,
            )
        )
        for s in sets_result.scalars().all():
            await self.session.delete(s)

        await self.session.delete(se)
        await self.session.flush()

    async def add_set(
        self,
        session_id: int,
        session_exercise_id: int,
        data: ExerciseSetCreate,
    ) -> ExerciseSetRead:
        await self._get_session(session_id)
        se = await self._get_session_exercise(session_exercise_id, session_id)
        exercise_set = ExerciseSet(
            session_exercise_id=se.id,
            set_number=data.set_number,
            reps=data.reps,
            weight=data.weight,
            duration=data.duration,
        )
        self.session.add(exercise_set)
        await self.session.flush()
        return ExerciseSetRead(
            id=exercise_set.id,
            set_number=exercise_set.set_number,
            reps=exercise_set.reps,
            weight=exercise_set.weight,
            duration=exercise_set.duration,
            is_completed=exercise_set.is_completed,
        )

    async def update_set(
        self,
        session_id: int,
        session_exercise_id: int,
        set_id: int,
        data: ExerciseSetUpdate,
    ) -> ExerciseSetRead:
        await self._get_session(session_id)
        await self._get_session_exercise(session_exercise_id, session_id)
        result = await self.session.execute(
            select(ExerciseSet).where(
                ExerciseSet.id == set_id,
                ExerciseSet.session_exercise_id == session_exercise_id,
            )
        )
        exercise_set = result.scalar_one_or_none()
        if exercise_set is None:
            raise NotFoundError("Exercise set")
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(exercise_set, key, value)
        await self.session.flush()
        return ExerciseSetRead(
            id=exercise_set.id,
            set_number=exercise_set.set_number,
            reps=exercise_set.reps,
            weight=exercise_set.weight,
            duration=exercise_set.duration,
            is_completed=exercise_set.is_completed,
        )

    async def delete_set(
        self,
        session_id: int,
        session_exercise_id: int,
        set_id: int,
    ) -> None:
        await self._get_session(session_id)
        await self._get_session_exercise(session_exercise_id, session_id)
        result = await self.session.execute(
            select(ExerciseSet).where(
                ExerciseSet.id == set_id,
                ExerciseSet.session_exercise_id == session_exercise_id,
            )
        )
        exercise_set = result.scalar_one_or_none()
        if exercise_set is None:
            raise NotFoundError("Exercise set")
        await self.session.delete(exercise_set)
        await self.session.flush()
