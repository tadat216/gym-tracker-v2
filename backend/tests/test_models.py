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


from app.models.exercise import Exercise, ExerciseBase, ExerciseType
from app.models.muscle_group import MuscleGroup


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
