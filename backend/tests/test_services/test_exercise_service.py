import pytest

from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate
from app.services.exceptions import (
    DuplicateNameError,
    InvalidReferenceError,
    NotFoundError,
)
from app.services.exercise import ExerciseService


class TestExerciseServiceList:
    async def test_list_returns_active_exercises(self, session, regular_user, exercise):
        svc = ExerciseService(session, regular_user.id)
        result = await svc.list()
        assert len(result) == 1
        assert result[0].name == "Bench Press"

    async def test_list_filter_by_muscle_group(
        self, session, regular_user, exercise, muscle_group
    ):
        mg2 = MuscleGroup(name="Back", color="#0000FF", user_id=regular_user.id)
        session.add(mg2)
        await session.flush()
        ex2 = Exercise(
            name="Pull-ups",
            type=ExerciseType.BODYWEIGHT,
            muscle_group_id=mg2.id,
            user_id=regular_user.id,
        )
        session.add(ex2)
        await session.flush()
        svc = ExerciseService(session, regular_user.id)
        result = await svc.list(muscle_group_id=muscle_group.id)
        assert len(result) == 1
        assert result[0].name == "Bench Press"

    async def test_list_sorted_by_name(self, session, regular_user, muscle_group):
        session.add(
            Exercise(
                name="Zzz",
                type=ExerciseType.WEIGHT,
                muscle_group_id=muscle_group.id,
                user_id=regular_user.id,
            )
        )
        session.add(
            Exercise(
                name="Aaa",
                type=ExerciseType.WEIGHT,
                muscle_group_id=muscle_group.id,
                user_id=regular_user.id,
            )
        )
        await session.flush()
        svc = ExerciseService(session, regular_user.id)
        result = await svc.list()
        assert [r.name for r in result] == ["Aaa", "Zzz"]


class TestExerciseServiceGet:
    async def test_get_returns_exercise(self, session, regular_user, exercise):
        svc = ExerciseService(session, regular_user.id)
        result = await svc.get(exercise.id)
        assert result.name == "Bench Press"

    async def test_get_not_found(self, session, regular_user):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.get(99999)


class TestExerciseServiceCreate:
    async def test_create(self, session, regular_user, muscle_group):
        svc = ExerciseService(session, regular_user.id)
        ex = await svc.create(
            ExerciseCreate(
                name="Incline Press",
                type=ExerciseType.WEIGHT,
                muscle_group_id=muscle_group.id,
            )
        )
        assert ex.name == "Incline Press"
        assert ex.user_id == regular_user.id

    async def test_create_duplicate_name(
        self, session, regular_user, exercise, muscle_group
    ):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(DuplicateNameError):
            await svc.create(
                ExerciseCreate(
                    name="Bench Press",
                    type=ExerciseType.WEIGHT,
                    muscle_group_id=muscle_group.id,
                )
            )

    async def test_create_invalid_muscle_group(self, session, regular_user):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(InvalidReferenceError):
            await svc.create(
                ExerciseCreate(
                    name="Bad",
                    type=ExerciseType.WEIGHT,
                    muscle_group_id=99999,
                )
            )

    async def test_create_other_users_muscle_group(
        self, session, regular_user, admin_user
    ):
        mg = MuscleGroup(name="Other", color="#000000", user_id=admin_user.id)
        session.add(mg)
        await session.flush()
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(InvalidReferenceError):
            await svc.create(
                ExerciseCreate(
                    name="Bad",
                    type=ExerciseType.WEIGHT,
                    muscle_group_id=mg.id,
                )
            )

    async def test_create_reuse_deleted_name(
        self, session, regular_user, exercise, muscle_group
    ):
        exercise.is_active = False
        await session.flush()
        svc = ExerciseService(session, regular_user.id)
        ex = await svc.create(
            ExerciseCreate(
                name="Bench Press",
                type=ExerciseType.WEIGHT,
                muscle_group_id=muscle_group.id,
            )
        )
        assert ex.name == "Bench Press"


class TestExerciseServiceUpdate:
    async def test_update(self, session, regular_user, exercise):
        svc = ExerciseService(session, regular_user.id)
        ex = await svc.update(exercise.id, ExerciseUpdate(name="Flat Bench Press"))
        assert ex.name == "Flat Bench Press"

    async def test_update_not_found(self, session, regular_user):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.update(99999, ExerciseUpdate(name="Nope"))

    async def test_update_invalid_muscle_group(self, session, regular_user, exercise):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(InvalidReferenceError):
            await svc.update(exercise.id, ExerciseUpdate(muscle_group_id=99999))


class TestExerciseServiceDelete:
    async def test_delete(self, session, regular_user, exercise):
        svc = ExerciseService(session, regular_user.id)
        ex = await svc.delete(exercise.id)
        assert ex.is_active is False

    async def test_delete_not_found(self, session, regular_user):
        svc = ExerciseService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.delete(99999)
