from app.models.muscle_group import MuscleGroup, MuscleGroupBase


class TestMuscleGroupModel:
    async def test_create_muscle_group(self, session, admin_user):
        group = MuscleGroup(
            name="Chest",
            color="#EF4444",
            user_id=admin_user.id,
        )
        session.add(group)
        await session.flush()

        assert group.id is not None
        assert group.name == "Chest"
        assert group.color == "#EF4444"
        assert group.user_id == admin_user.id
        assert group.is_active is True
        assert group.created_at is not None

    async def test_muscle_group_base_excludes_internal_fields(self):
        base = MuscleGroupBase(id=1, name="Chest", color="#EF4444")
        data = base.model_dump()
        assert data == {"id": 1, "name": "Chest", "color": "#EF4444"}
        assert "user_id" not in data
        assert "is_active" not in data
        assert "created_at" not in data


from app.models.exercise import Exercise, ExerciseBase, ExerciseType  # noqa: E402
from app.models.muscle_group import MuscleGroup  # noqa: E402


class TestExerciseModel:
    async def test_create_weight_exercise(self, session, admin_user):
        group = MuscleGroup(name="Chest", color="#EF4444", user_id=admin_user.id)
        session.add(group)
        await session.flush()

        exercise = Exercise(
            name="Bench Press",
            type=ExerciseType.WEIGHT,
            muscle_group_id=group.id,
            user_id=admin_user.id,
        )
        session.add(exercise)
        await session.flush()

        assert exercise.id is not None
        assert exercise.name == "Bench Press"
        assert exercise.type == ExerciseType.WEIGHT
        assert exercise.muscle_group_id == group.id
        assert exercise.is_active is True

    async def test_exercise_types(self):
        assert ExerciseType.WEIGHT == "weight"
        assert ExerciseType.BODYWEIGHT == "bodyweight"
        assert ExerciseType.DURATION == "duration"

    async def test_exercise_base_excludes_internal_fields(self):
        base = ExerciseBase(
            id=1, name="Bench Press", type=ExerciseType.WEIGHT, muscle_group_id=1
        )
        data = base.model_dump()
        assert data == {
            "id": 1,
            "name": "Bench Press",
            "type": "weight",
            "muscle_group_id": 1,
        }
        assert "user_id" not in data


from app.models.plan_exercise import PlanExercise, PlanExerciseBase  # noqa: E402
from app.models.workout_plan import WorkoutPlan, WorkoutPlanBase  # noqa: E402


class TestWorkoutPlanModel:
    async def test_create_plan_with_exercises(self, session, admin_user):
        group = MuscleGroup(name="Chest", color="#EF4444", user_id=admin_user.id)
        session.add(group)
        await session.flush()

        exercise = Exercise(
            name="Bench Press",
            type=ExerciseType.WEIGHT,
            muscle_group_id=group.id,
            user_id=admin_user.id,
        )
        session.add(exercise)
        await session.flush()

        plan = WorkoutPlan(name="Push Day A", user_id=admin_user.id)
        session.add(plan)
        await session.flush()

        assert plan.id is not None
        assert plan.name == "Push Day A"
        assert plan.created_at is not None
        assert plan.updated_at is not None

        plan_exercise = PlanExercise(
            plan_id=plan.id,
            exercise_id=exercise.id,
            sort_order=1,
        )
        session.add(plan_exercise)
        await session.flush()

        assert plan_exercise.id is not None
        assert plan_exercise.sort_order == 1

    async def test_plan_base_excludes_internal_fields(self):
        base = WorkoutPlanBase(id=1, name="Push Day A")
        data = base.model_dump()
        assert data == {"id": 1, "name": "Push Day A"}
        assert "user_id" not in data

    async def test_plan_exercise_base_excludes_plan_id(self):
        base = PlanExerciseBase(id=1, exercise_id=5, sort_order=1)
        data = base.model_dump()
        assert data == {"id": 1, "exercise_id": 5, "sort_order": 1}
        assert "plan_id" not in data


from datetime import date  # noqa: E402

from app.models.exercise_set import ExerciseSet, ExerciseSetBase  # noqa: E402
from app.models.session_exercise import ExerciseStatus, SessionExercise, SessionExerciseBase  # noqa: E402
from app.models.workout_session import SessionStatus, WorkoutSession, WorkoutSessionBase  # noqa: E402


class TestWorkoutSessionModels:
    async def test_full_session_workflow(self, session, admin_user):
        """Test creating a full session with exercises and sets."""
        group = MuscleGroup(name="Chest", color="#EF4444", user_id=admin_user.id)
        session.add(group)
        await session.flush()

        exercise = Exercise(
            name="Bench Press",
            type=ExerciseType.WEIGHT,
            muscle_group_id=group.id,
            user_id=admin_user.id,
        )
        session.add(exercise)
        await session.flush()

        workout = WorkoutSession(
            user_id=admin_user.id,
            date=date(2026, 3, 26),
            status=SessionStatus.IN_PROGRESS,
        )
        session.add(workout)
        await session.flush()

        assert workout.id is not None
        assert workout.plan_id is None
        assert workout.status == SessionStatus.IN_PROGRESS
        assert workout.completed_at is None

        session_ex = SessionExercise(
            session_id=workout.id,
            exercise_id=exercise.id,
            sort_order=1,
            status=ExerciseStatus.PENDING,
        )
        session.add(session_ex)
        await session.flush()

        assert session_ex.id is not None
        assert session_ex.status == ExerciseStatus.PENDING

        ex_set = ExerciseSet(
            session_exercise_id=session_ex.id,
            set_number=1,
            reps=8,
            weight=80.0,
            is_completed=True,
        )
        session.add(ex_set)
        await session.flush()

        assert ex_set.id is not None
        assert ex_set.reps == 8
        assert float(ex_set.weight) == 80.0
        assert ex_set.duration is None
        assert ex_set.is_completed is True

    async def test_duration_exercise_set(self, session, admin_user):
        """Test a duration-type set (e.g. plank)."""
        group = MuscleGroup(name="Core", color="#6366F1", user_id=admin_user.id)
        session.add(group)
        await session.flush()

        exercise = Exercise(
            name="Plank",
            type=ExerciseType.DURATION,
            muscle_group_id=group.id,
            user_id=admin_user.id,
        )
        session.add(exercise)
        await session.flush()

        workout = WorkoutSession(
            user_id=admin_user.id,
            date=date(2026, 3, 26),
            status=SessionStatus.IN_PROGRESS,
        )
        session.add(workout)
        await session.flush()

        session_ex = SessionExercise(
            session_id=workout.id,
            exercise_id=exercise.id,
            sort_order=1,
            status=ExerciseStatus.COMPLETED,
        )
        session.add(session_ex)
        await session.flush()

        ex_set = ExerciseSet(
            session_exercise_id=session_ex.id,
            set_number=1,
            duration=60,
            is_completed=True,
        )
        session.add(ex_set)
        await session.flush()

        assert ex_set.duration == 60
        assert ex_set.reps is None
        assert ex_set.weight is None

    async def test_session_base_excludes_user_id(self):
        base = WorkoutSessionBase(
            id=1,
            plan_id=None,
            date=date(2026, 3, 26),
            status=SessionStatus.IN_PROGRESS,
            notes=None,
        )
        data = base.model_dump()
        assert "user_id" not in data
        assert data["status"] == "in_progress"

    async def test_session_exercise_base_excludes_session_id(self):
        base = SessionExerciseBase(
            id=1, exercise_id=5, sort_order=1, status=ExerciseStatus.PENDING
        )
        data = base.model_dump()
        assert "session_id" not in data

    async def test_exercise_set_base_excludes_session_exercise_id(self):
        base = ExerciseSetBase(
            id=1, set_number=1, reps=8, weight=80.0, duration=None, is_completed=True
        )
        data = base.model_dump()
        assert "session_exercise_id" not in data

    async def test_session_status_enum(self):
        assert SessionStatus.IN_PROGRESS == "in_progress"
        assert SessionStatus.COMPLETED == "completed"

    async def test_exercise_status_enum(self):
        assert ExerciseStatus.PENDING == "pending"
        assert ExerciseStatus.COMPLETED == "completed"
        assert ExerciseStatus.SKIPPED == "skipped"
