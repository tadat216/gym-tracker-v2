import pytest  # noqa: F401

from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup


class TestAdminListExercises:
    async def test_list_system_exercises(self, admin_client, system_exercise):
        response = await admin_client.get("/api/v1/admin/exercises")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Bench Press"

    async def test_list_filter_by_muscle_group(
        self,
        admin_client,
        system_exercise,
        system_muscle_group,
        session,
        system_user,
    ):
        mg2 = MuscleGroup(name="Back", color="#0000FF", user_id=system_user.id)
        session.add(mg2)
        await session.flush()
        ex2 = Exercise(
            name="Pull-ups",
            type=ExerciseType.BODYWEIGHT,
            muscle_group_id=mg2.id,
            user_id=system_user.id,
        )
        session.add(ex2)
        await session.flush()

        response = await admin_client.get(
            f"/api/v1/admin/exercises?muscle_group_id={system_muscle_group.id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Bench Press"

    async def test_non_admin_forbidden(self, user_client, system_exercise):
        response = await user_client.get("/api/v1/admin/exercises")
        assert response.status_code == 403

    async def test_no_token(self, client):
        response = await client.get("/api/v1/admin/exercises")
        assert response.status_code == 401


class TestAdminGetExercise:
    async def test_get_system_exercise(self, admin_client, system_exercise):
        response = await admin_client.get(
            f"/api/v1/admin/exercises/{system_exercise.id}"
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Bench Press"

    async def test_get_non_system_exercise_returns_404(
        self, admin_client, exercise, system_user
    ):
        response = await admin_client.get(f"/api/v1/admin/exercises/{exercise.id}")
        assert response.status_code == 404

    async def test_get_not_found(self, admin_client, system_user):
        response = await admin_client.get("/api/v1/admin/exercises/99999")
        assert response.status_code == 404


class TestAdminCreateExercise:
    async def test_create_system_exercise(self, admin_client, system_muscle_group):
        response = await admin_client.post(
            "/api/v1/admin/exercises",
            json={
                "name": "Incline Press",
                "type": "weight",
                "muscle_group_id": system_muscle_group.id,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Incline Press"
        assert data["muscle_group_id"] == system_muscle_group.id

    async def test_create_duplicate_name(
        self, admin_client, system_exercise, system_muscle_group
    ):
        response = await admin_client.post(
            "/api/v1/admin/exercises",
            json={
                "name": "Bench Press",
                "type": "weight",
                "muscle_group_id": system_muscle_group.id,
            },
        )
        assert response.status_code == 409

    async def test_create_invalid_muscle_group(self, admin_client, system_user):
        response = await admin_client.post(
            "/api/v1/admin/exercises",
            json={
                "name": "Bad Exercise",
                "type": "weight",
                "muscle_group_id": 99999,
            },
        )
        assert response.status_code == 400

    async def test_create_with_non_system_muscle_group(
        self, admin_client, muscle_group, system_user
    ):
        response = await admin_client.post(
            "/api/v1/admin/exercises",
            json={
                "name": "Bad Exercise",
                "type": "weight",
                "muscle_group_id": muscle_group.id,
            },
        )
        assert response.status_code == 400


class TestAdminUpdateExercise:
    async def test_update_system_exercise(self, admin_client, system_exercise):
        response = await admin_client.patch(
            f"/api/v1/admin/exercises/{system_exercise.id}",
            json={"name": "Flat Bench Press"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Flat Bench Press"

    async def test_update_not_found(self, admin_client, system_user):
        response = await admin_client.patch(
            "/api/v1/admin/exercises/99999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404

    async def test_update_invalid_muscle_group(self, admin_client, system_exercise):
        response = await admin_client.patch(
            f"/api/v1/admin/exercises/{system_exercise.id}",
            json={"muscle_group_id": 99999},
        )
        assert response.status_code == 400


class TestAdminDeleteExercise:
    async def test_delete_system_exercise(self, admin_client, system_exercise):
        response = await admin_client.delete(
            f"/api/v1/admin/exercises/{system_exercise.id}"
        )
        assert response.status_code == 200
        assert "deactivated" in response.json()["message"].lower()

    async def test_delete_not_found(self, admin_client, system_user):
        response = await admin_client.delete("/api/v1/admin/exercises/99999")
        assert response.status_code == 404
