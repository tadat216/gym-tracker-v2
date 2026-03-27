import pytest  # noqa: F401

from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup
from app.models.plan_exercise import PlanExercise
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

    async def test_list_plans_scoped_to_user(self, user_client, session, admin_user):
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
        response = await user_client.get(f"/api/v1/workout-plans/{workout_plan.id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Push Day"

    async def test_get_plan_not_found(self, user_client):
        response = await user_client.get("/api/v1/workout-plans/99999")
        assert response.status_code == 404

    async def test_get_plan_other_user(self, user_client, session, admin_user):
        other_plan = WorkoutPlan(name="Other", user_id=admin_user.id)
        session.add(other_plan)
        await session.flush()
        response = await user_client.get(f"/api/v1/workout-plans/{other_plan.id}")
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

    async def test_create_plan_reuse_deleted_name(self, user_client, workout_plan):
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
        response = await user_client.delete(f"/api/v1/workout-plans/{workout_plan.id}")
        assert response.status_code == 200
        assert "deactivated" in response.json()["message"].lower()

        list_response = await user_client.get("/api/v1/workout-plans")
        assert len(list_response.json()) == 0

    async def test_delete_plan_not_found(self, user_client):
        response = await user_client.delete("/api/v1/workout-plans/99999")
        assert response.status_code == 404


class TestAddPlanExercise:
    async def test_add_exercise_to_plan(self, user_client, workout_plan, exercise):
        response = await user_client.post(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["exercise_id"] == exercise.id
        assert data["sort_order"] == 0
        assert data["exercise_name"] == "Bench Press"
        assert data["muscle_group_name"] == "Chest"

    async def test_add_exercise_plan_not_found(self, user_client, exercise):
        response = await user_client.post(
            "/api/v1/workout-plans/99999/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        assert response.status_code == 404

    async def test_add_exercise_not_found(self, user_client, workout_plan):
        response = await user_client.post(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises",
            json={"exercise_id": 99999, "sort_order": 0},
        )
        assert response.status_code == 400

    async def test_add_exercise_other_users_exercise(
        self, user_client, workout_plan, session, admin_user
    ):
        mg = MuscleGroup(name="Back", color="#0000FF", user_id=admin_user.id)
        session.add(mg)
        await session.flush()
        other_ex = Exercise(
            name="Other",
            type=ExerciseType.WEIGHT,
            muscle_group_id=mg.id,
            user_id=admin_user.id,
        )
        session.add(other_ex)
        await session.flush()
        response = await user_client.post(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises",
            json={"exercise_id": other_ex.id, "sort_order": 0},
        )
        assert response.status_code == 400

    async def test_add_exercise_shows_in_plan(
        self, user_client, workout_plan, exercise
    ):
        await user_client.post(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        response = await user_client.get(f"/api/v1/workout-plans/{workout_plan.id}")
        exercises = response.json()["exercises"]
        assert len(exercises) == 1
        assert exercises[0]["exercise_name"] == "Bench Press"
        assert exercises[0]["muscle_group_name"] == "Chest"


class TestRemovePlanExercise:
    async def test_remove_exercise_from_plan(
        self, user_client, workout_plan, exercise, session
    ):
        pe = PlanExercise(
            plan_id=workout_plan.id,
            exercise_id=exercise.id,
            sort_order=0,
        )
        session.add(pe)
        await session.flush()
        response = await user_client.delete(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises/{pe.id}"
        )
        assert response.status_code == 200
        assert "removed" in response.json()["message"].lower()

    async def test_remove_exercise_plan_not_found(self, user_client):
        response = await user_client.delete("/api/v1/workout-plans/99999/exercises/1")
        assert response.status_code == 404

    async def test_remove_exercise_not_in_plan(self, user_client, workout_plan):
        response = await user_client.delete(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises/99999"
        )
        assert response.status_code == 404


class TestReorderPlanExercises:
    async def test_reorder_exercises(
        self,
        user_client,
        workout_plan,
        exercise,
        session,
        regular_user,
        muscle_group,
    ):
        ex2 = Exercise(
            name="Incline Press",
            type=ExerciseType.WEIGHT,
            muscle_group_id=muscle_group.id,
            user_id=regular_user.id,
        )
        session.add(ex2)
        await session.flush()

        pe1 = PlanExercise(
            plan_id=workout_plan.id, exercise_id=exercise.id, sort_order=0
        )
        pe2 = PlanExercise(plan_id=workout_plan.id, exercise_id=ex2.id, sort_order=1)
        session.add_all([pe1, pe2])
        await session.flush()

        response = await user_client.patch(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises/reorder",
            json={"plan_exercise_ids": [pe2.id, pe1.id]},
        )
        assert response.status_code == 200

        plan_response = await user_client.get(
            f"/api/v1/workout-plans/{workout_plan.id}"
        )
        exercises = plan_response.json()["exercises"]
        assert exercises[0]["id"] == pe2.id
        assert exercises[0]["sort_order"] == 0
        assert exercises[1]["id"] == pe1.id
        assert exercises[1]["sort_order"] == 1

    async def test_reorder_plan_not_found(self, user_client):
        response = await user_client.patch(
            "/api/v1/workout-plans/99999/exercises/reorder",
            json={"plan_exercise_ids": []},
        )
        assert response.status_code == 404

    async def test_reorder_missing_ids(
        self, user_client, workout_plan, exercise, session
    ):
        pe = PlanExercise(
            plan_id=workout_plan.id, exercise_id=exercise.id, sort_order=0
        )
        session.add(pe)
        await session.flush()
        response = await user_client.patch(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises/reorder",
            json={"plan_exercise_ids": []},
        )
        assert response.status_code == 400

    async def test_reorder_extra_ids(
        self, user_client, workout_plan, exercise, session
    ):
        pe = PlanExercise(
            plan_id=workout_plan.id, exercise_id=exercise.id, sort_order=0
        )
        session.add(pe)
        await session.flush()
        response = await user_client.patch(
            f"/api/v1/workout-plans/{workout_plan.id}/exercises/reorder",
            json={"plan_exercise_ids": [pe.id, 99999]},
        )
        assert response.status_code == 400
