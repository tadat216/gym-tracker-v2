import pytest  # noqa: F401

from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup


class TestListExercises:
    async def test_list_exercises(self, user_client, exercise):
        response = await user_client.get("/api/v1/exercises")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Bench Press"
        assert data[0]["type"] == "weight"
        assert data[0]["is_active"] is True

    async def test_list_exercises_filter_by_muscle_group(
        self, user_client, exercise, muscle_group, session, regular_user
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

        response = await user_client.get(
            f"/api/v1/exercises?muscle_group_id={muscle_group.id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Bench Press"

    async def test_list_exercises_excludes_inactive(
        self, user_client, exercise, session
    ):
        exercise.is_active = False
        await session.flush()
        response = await user_client.get("/api/v1/exercises")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_exercises_scoped_to_user(
        self, user_client, session, admin_user, muscle_group
    ):
        other_ex = Exercise(
            name="Other",
            type=ExerciseType.WEIGHT,
            muscle_group_id=muscle_group.id,
            user_id=admin_user.id,
        )
        session.add(other_ex)
        await session.flush()
        response = await user_client.get("/api/v1/exercises")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_exercises_no_token(self, client):
        response = await client.get("/api/v1/exercises")
        assert response.status_code == 401


class TestGetExercise:
    async def test_get_exercise(self, user_client, exercise):
        response = await user_client.get(f"/api/v1/exercises/{exercise.id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Bench Press"

    async def test_get_exercise_not_found(self, user_client):
        response = await user_client.get("/api/v1/exercises/99999")
        assert response.status_code == 404

    async def test_get_exercise_other_user(
        self, user_client, session, admin_user, muscle_group
    ):
        other_ex = Exercise(
            name="Other",
            type=ExerciseType.WEIGHT,
            muscle_group_id=muscle_group.id,
            user_id=admin_user.id,
        )
        session.add(other_ex)
        await session.flush()
        response = await user_client.get(f"/api/v1/exercises/{other_ex.id}")
        assert response.status_code == 404


class TestCreateExercise:
    async def test_create_exercise(self, user_client, muscle_group):
        response = await user_client.post(
            "/api/v1/exercises",
            json={
                "name": "Incline Press",
                "type": "weight",
                "muscle_group_id": muscle_group.id,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Incline Press"
        assert data["type"] == "weight"
        assert data["muscle_group_id"] == muscle_group.id

    async def test_create_exercise_duplicate_name(
        self, user_client, exercise, muscle_group
    ):
        response = await user_client.post(
            "/api/v1/exercises",
            json={
                "name": "Bench Press",
                "type": "weight",
                "muscle_group_id": muscle_group.id,
            },
        )
        assert response.status_code == 409

    async def test_create_exercise_invalid_muscle_group(self, user_client):
        response = await user_client.post(
            "/api/v1/exercises",
            json={
                "name": "Bad Exercise",
                "type": "weight",
                "muscle_group_id": 99999,
            },
        )
        assert response.status_code == 400

    async def test_create_exercise_other_users_muscle_group(
        self, user_client, session, admin_user
    ):
        other_mg = MuscleGroup(name="Other", color="#000000", user_id=admin_user.id)
        session.add(other_mg)
        await session.flush()
        response = await user_client.post(
            "/api/v1/exercises",
            json={
                "name": "Bad Exercise",
                "type": "weight",
                "muscle_group_id": other_mg.id,
            },
        )
        assert response.status_code == 400

    async def test_create_exercise_reuse_deleted_name(
        self, user_client, exercise, muscle_group
    ):
        await user_client.delete(f"/api/v1/exercises/{exercise.id}")
        response = await user_client.post(
            "/api/v1/exercises",
            json={
                "name": "Bench Press",
                "type": "weight",
                "muscle_group_id": muscle_group.id,
            },
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Bench Press"


class TestUpdateExercise:
    async def test_update_exercise(self, user_client, exercise):
        response = await user_client.patch(
            f"/api/v1/exercises/{exercise.id}",
            json={"name": "Flat Bench Press"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Flat Bench Press"

    async def test_update_exercise_type(self, user_client, exercise):
        response = await user_client.patch(
            f"/api/v1/exercises/{exercise.id}",
            json={"type": "bodyweight"},
        )
        assert response.status_code == 200
        assert response.json()["type"] == "bodyweight"

    async def test_update_exercise_not_found(self, user_client):
        response = await user_client.patch(
            "/api/v1/exercises/99999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404

    async def test_update_exercise_duplicate_name(
        self, user_client, exercise, session, regular_user, muscle_group
    ):
        ex2 = Exercise(
            name="Dumbbell Press",
            type=ExerciseType.WEIGHT,
            muscle_group_id=muscle_group.id,
            user_id=regular_user.id,
        )
        session.add(ex2)
        await session.flush()
        response = await user_client.patch(
            f"/api/v1/exercises/{ex2.id}",
            json={"name": "Bench Press"},
        )
        assert response.status_code == 409

    async def test_update_exercise_invalid_muscle_group(self, user_client, exercise):
        response = await user_client.patch(
            f"/api/v1/exercises/{exercise.id}",
            json={"muscle_group_id": 99999},
        )
        assert response.status_code == 400


class TestDeleteExercise:
    async def test_delete_exercise(self, user_client, exercise):
        response = await user_client.delete(f"/api/v1/exercises/{exercise.id}")
        assert response.status_code == 200
        assert "deactivated" in response.json()["message"].lower()

        list_response = await user_client.get("/api/v1/exercises")
        assert len(list_response.json()) == 0

    async def test_delete_exercise_not_found(self, user_client):
        response = await user_client.delete("/api/v1/exercises/99999")
        assert response.status_code == 404
