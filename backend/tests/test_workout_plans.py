import pytest  # noqa: F401

from app.models.workout_plan import WorkoutPlan


@pytest.fixture
async def workout_plan(session, regular_user):
    plan = WorkoutPlan(name="Push Day", user_id=regular_user.id)
    session.add(plan)
    await session.flush()
    return plan


class TestListWorkoutPlans:
    async def test_list_plans(self, user_client, workout_plan):
        response = await user_client.get("/api/v1/workout-plans")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Push Day"
        assert data[0]["is_active"] is True
        assert "exercises" in data[0]

    async def test_list_plans_excludes_inactive(
        self, user_client, workout_plan, session
    ):
        workout_plan.is_active = False
        await session.flush()
        response = await user_client.get("/api/v1/workout-plans")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_plans_scoped_to_user(
        self, user_client, session, admin_user
    ):
        other_plan = WorkoutPlan(name="Other Plan", user_id=admin_user.id)
        session.add(other_plan)
        await session.flush()
        response = await user_client.get("/api/v1/workout-plans")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_plans_no_token(self, client):
        response = await client.get("/api/v1/workout-plans")
        assert response.status_code == 401


class TestGetWorkoutPlan:
    async def test_get_plan(self, user_client, workout_plan):
        response = await user_client.get(
            f"/api/v1/workout-plans/{workout_plan.id}"
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Push Day"

    async def test_get_plan_not_found(self, user_client):
        response = await user_client.get("/api/v1/workout-plans/99999")
        assert response.status_code == 404

    async def test_get_plan_other_user(self, user_client, session, admin_user):
        other_plan = WorkoutPlan(name="Other", user_id=admin_user.id)
        session.add(other_plan)
        await session.flush()
        response = await user_client.get(
            f"/api/v1/workout-plans/{other_plan.id}"
        )
        assert response.status_code == 404


class TestCreateWorkoutPlan:
    async def test_create_plan(self, user_client):
        response = await user_client.post(
            "/api/v1/workout-plans",
            json={"name": "Leg Day"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Leg Day"
        assert data["is_active"] is True
        assert data["exercises"] == []

    async def test_create_plan_duplicate_name(self, user_client, workout_plan):
        response = await user_client.post(
            "/api/v1/workout-plans",
            json={"name": "Push Day"},
        )
        assert response.status_code == 409

    async def test_create_plan_reuse_deleted_name(
        self, user_client, workout_plan
    ):
        await user_client.delete(f"/api/v1/workout-plans/{workout_plan.id}")
        response = await user_client.post(
            "/api/v1/workout-plans",
            json={"name": "Push Day"},
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Push Day"


class TestUpdateWorkoutPlan:
    async def test_update_plan(self, user_client, workout_plan):
        response = await user_client.patch(
            f"/api/v1/workout-plans/{workout_plan.id}",
            json={"name": "Pull Day"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Pull Day"

    async def test_update_plan_not_found(self, user_client):
        response = await user_client.patch(
            "/api/v1/workout-plans/99999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404

    async def test_update_plan_duplicate_name(
        self, user_client, workout_plan, session, regular_user
    ):
        plan2 = WorkoutPlan(name="Pull Day", user_id=regular_user.id)
        session.add(plan2)
        await session.flush()
        response = await user_client.patch(
            f"/api/v1/workout-plans/{plan2.id}",
            json={"name": "Push Day"},
        )
        assert response.status_code == 409


class TestDeleteWorkoutPlan:
    async def test_delete_plan(self, user_client, workout_plan):
        response = await user_client.delete(
            f"/api/v1/workout-plans/{workout_plan.id}"
        )
        assert response.status_code == 200
        assert "deactivated" in response.json()["message"].lower()

        list_response = await user_client.get("/api/v1/workout-plans")
        assert len(list_response.json()) == 0

    async def test_delete_plan_not_found(self, user_client):
        response = await user_client.delete("/api/v1/workout-plans/99999")
        assert response.status_code == 404
