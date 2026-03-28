import pytest  # noqa: F401
import pytest_asyncio

from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.models.exercise import Exercise, ExerciseType
from app.models.plan_exercise import PlanExercise
from app.models.user import User
from app.models.workout_plan import WorkoutPlan

BASE = "/api/v1/workout-sessions"


@pytest_asyncio.fixture
async def workout_plan(session, regular_user):
    plan = WorkoutPlan(name="Push Day", user_id=regular_user.id)
    session.add(plan)
    await session.flush()
    return plan


@pytest_asyncio.fixture
async def plan_with_exercises(session, workout_plan, exercise):
    pe = PlanExercise(
        plan_id=workout_plan.id,
        exercise_id=exercise.id,
        sort_order=0,
    )
    session.add(pe)
    await session.flush()
    return workout_plan


@pytest_asyncio.fixture
async def second_exercise(session, regular_user, muscle_group):
    ex = Exercise(
        name="Overhead Press",
        type=ExerciseType.WEIGHT,
        muscle_group_id=muscle_group.id,
        user_id=regular_user.id,
    )
    session.add(ex)
    await session.flush()
    return ex


@pytest_asyncio.fixture
async def duration_exercise(session, regular_user, muscle_group):
    ex = Exercise(
        name="Plank",
        type=ExerciseType.DURATION,
        muscle_group_id=muscle_group.id,
        user_id=regular_user.id,
    )
    session.add(ex)
    await session.flush()
    return ex


class TestCreateWorkoutSession:
    @pytest.mark.asyncio
    async def test_create_freestyle_session(self, user_client):
        response = await user_client.post(BASE, json={})
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "in_progress"
        assert data["exercises"] == []
        assert data["plan_id"] is None

    @pytest.mark.asyncio
    async def test_create_session_with_date(self, user_client):
        response = await user_client.post(BASE, json={"date": "2025-01-15"})
        assert response.status_code == 201
        assert response.json()["date"] == "2025-01-15"

    @pytest.mark.asyncio
    async def test_create_session_with_notes(self, user_client):
        response = await user_client.post(
            BASE, json={"notes": "Morning workout"}
        )
        assert response.status_code == 201
        assert response.json()["notes"] == "Morning workout"

    @pytest.mark.asyncio
    async def test_create_session_from_plan(self, user_client, plan_with_exercises):
        response = await user_client.post(
            BASE, json={"plan_id": plan_with_exercises.id}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["plan_id"] == plan_with_exercises.id
        assert len(data["exercises"]) == 1
        assert data["exercises"][0]["exercise_name"] == "Bench Press"

    @pytest.mark.asyncio
    async def test_create_session_invalid_plan(self, user_client):
        response = await user_client.post(BASE, json={"plan_id": 99999})
        assert response.status_code == 400


class TestGetWorkoutSession:
    @pytest.mark.asyncio
    async def test_get_session(self, user_client):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        response = await user_client.get(f"{BASE}/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert "status" in data
        assert "date" in data
        assert "started_at" in data
        assert "exercises" in data

    @pytest.mark.asyncio
    async def test_get_session_not_found(self, user_client):
        response = await user_client.get(f"{BASE}/99999")
        assert response.status_code == 404


class TestListWorkoutSessions:
    @pytest.mark.asyncio
    async def test_list_sessions(self, user_client):
        await user_client.post(BASE, json={})
        await user_client.post(BASE, json={})
        response = await user_client.get(BASE)
        assert response.status_code == 200
        assert len(response.json()) == 2

    @pytest.mark.asyncio
    async def test_list_sessions_date_filter(self, user_client):
        await user_client.post(BASE, json={"date": "2025-01-10"})
        await user_client.post(BASE, json={"date": "2025-01-20"})
        await user_client.post(BASE, json={"date": "2025-02-01"})

        response = await user_client.get(
            f"{BASE}?date_from=2025-01-15&date_to=2025-01-25"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["date"] == "2025-01-20"


class TestUpdateWorkoutSession:
    @pytest.mark.asyncio
    async def test_update_session_notes(self, user_client):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        response = await user_client.patch(
            f"{BASE}/{session_id}", json={"notes": "Updated notes"}
        )
        assert response.status_code == 200
        assert response.json()["notes"] == "Updated notes"

    @pytest.mark.asyncio
    async def test_update_session_date(self, user_client):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        response = await user_client.patch(
            f"{BASE}/{session_id}", json={"date": "2025-03-01"}
        )
        assert response.status_code == 200
        assert response.json()["date"] == "2025-03-01"

    @pytest.mark.asyncio
    async def test_update_session_not_found(self, user_client):
        response = await user_client.patch(
            f"{BASE}/99999", json={"notes": "nope"}
        )
        assert response.status_code == 404


class TestDeleteWorkoutSession:
    @pytest.mark.asyncio
    async def test_delete_session(self, user_client):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        response = await user_client.delete(f"{BASE}/{session_id}")
        assert response.status_code == 200

        get_response = await user_client.get(f"{BASE}/{session_id}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_session_not_found(self, user_client):
        response = await user_client.delete(f"{BASE}/99999")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_session_cascades_sets(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_ex = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        se_id = add_ex.json()["id"]
        await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 1, "reps": 10, "weight": 80.0},
        )
        await user_client.delete(f"{BASE}/{session_id}")

        # Session is gone — exercises and sets should be too
        get_response = await user_client.get(f"{BASE}/{session_id}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_user_scoping(self, user_client, admin_client):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        response = await admin_client.get(f"{BASE}/{session_id}")
        assert response.status_code == 404


class TestCompleteWorkoutSession:
    @pytest.mark.asyncio
    async def test_complete_session(self, user_client):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        response = await user_client.patch(f"{BASE}/{session_id}/complete")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["completed_at"] is not None

    @pytest.mark.asyncio
    async def test_complete_session_not_found(self, user_client):
        response = await user_client.patch(f"{BASE}/99999/complete")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_complete_session_with_exercises_no_sets(
        self, user_client, exercise
    ):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        response = await user_client.patch(f"{BASE}/{session_id}/complete")
        assert response.status_code == 200
        assert response.json()["status"] == "completed"

    @pytest.mark.asyncio
    async def test_edit_completed_session(self, user_client):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        await user_client.patch(f"{BASE}/{session_id}/complete")
        response = await user_client.patch(
            f"{BASE}/{session_id}", json={"notes": "Post-completion note"}
        )
        assert response.status_code == 200
        assert response.json()["notes"] == "Post-completion note"


class TestSessionExercises:
    @pytest.mark.asyncio
    async def test_add_exercise_to_session(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        response = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["exercise_name"] == "Bench Press"
        assert data["muscle_group_name"] == "Chest"

    @pytest.mark.asyncio
    async def test_add_exercise_invalid_id(self, user_client):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        response = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": 99999, "sort_order": 0},
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_add_exercise_to_nonexistent_session(self, user_client, exercise):
        response = await user_client.post(
            f"{BASE}/99999/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_remove_exercise_not_found(self, user_client):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        response = await user_client.delete(
            f"{BASE}/{session_id}/exercises/99999"
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_remove_exercise(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_response = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        se_id = add_response.json()["id"]
        await user_client.delete(f"{BASE}/{session_id}/exercises/{se_id}")

        get_response = await user_client.get(f"{BASE}/{session_id}")
        assert len(get_response.json()["exercises"]) == 0

    @pytest.mark.asyncio
    async def test_remove_exercise_cascades_sets(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_ex = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        se_id = add_ex.json()["id"]
        await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 1, "reps": 10, "weight": 80.0},
        )
        await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 2, "reps": 8, "weight": 85.0},
        )

        await user_client.delete(f"{BASE}/{session_id}/exercises/{se_id}")

        get_response = await user_client.get(f"{BASE}/{session_id}")
        assert len(get_response.json()["exercises"]) == 0


class TestExerciseSets:
    @pytest.mark.asyncio
    async def test_add_set(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_ex_response = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        se_id = add_ex_response.json()["id"]
        response = await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 1, "reps": 10, "weight": 80.0},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["set_number"] == 1
        assert data["reps"] == 10
        assert float(data["weight"]) == 80.0
        assert data["is_completed"] is False

    @pytest.mark.asyncio
    async def test_add_duration_set(self, user_client, duration_exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_ex_response = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": duration_exercise.id, "sort_order": 0},
        )
        se_id = add_ex_response.json()["id"]
        response = await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 1, "duration": 60},
        )
        assert response.status_code == 201
        assert response.json()["duration"] == 60

    @pytest.mark.asyncio
    async def test_update_set(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_ex_response = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        se_id = add_ex_response.json()["id"]
        add_set_response = await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 1, "reps": 10, "weight": 80.0},
        )
        set_id = add_set_response.json()["id"]
        response = await user_client.patch(
            f"{BASE}/{session_id}/exercises/{se_id}/sets/{set_id}",
            json={"reps": 12, "weight": 85.0},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["reps"] == 12
        assert float(data["weight"]) == 85.0

    @pytest.mark.asyncio
    async def test_update_set_completed(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_ex_response = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        se_id = add_ex_response.json()["id"]
        add_set_response = await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 1, "reps": 10, "weight": 80.0},
        )
        set_id = add_set_response.json()["id"]
        response = await user_client.patch(
            f"{BASE}/{session_id}/exercises/{se_id}/sets/{set_id}",
            json={"is_completed": True},
        )
        assert response.status_code == 200
        assert response.json()["is_completed"] is True

    @pytest.mark.asyncio
    async def test_delete_set(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_ex_response = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        se_id = add_ex_response.json()["id"]
        add_set_response = await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 1, "reps": 10, "weight": 80.0},
        )
        set_id = add_set_response.json()["id"]
        await user_client.delete(
            f"{BASE}/{session_id}/exercises/{se_id}/sets/{set_id}"
        )

        get_response = await user_client.get(f"{BASE}/{session_id}")
        exercise_data = get_response.json()["exercises"][0]
        assert len(exercise_data["sets"]) == 0

    @pytest.mark.asyncio
    async def test_exercise_is_completed_derived(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_ex_response = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        se_id = add_ex_response.json()["id"]

        set1_response = await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 1, "reps": 10, "weight": 80.0},
        )
        set2_response = await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 2, "reps": 10, "weight": 80.0},
        )
        set1_id = set1_response.json()["id"]
        set2_id = set2_response.json()["id"]

        await user_client.patch(
            f"{BASE}/{session_id}/exercises/{se_id}/sets/{set1_id}",
            json={"is_completed": True},
        )
        await user_client.patch(
            f"{BASE}/{session_id}/exercises/{se_id}/sets/{set2_id}",
            json={"is_completed": True},
        )

        get_response = await user_client.get(f"{BASE}/{session_id}")
        exercise_data = get_response.json()["exercises"][0]
        assert exercise_data["is_completed"] is True

    @pytest.mark.asyncio
    async def test_exercise_not_completed_no_sets(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        get_response = await user_client.get(f"{BASE}/{session_id}")
        exercise_data = get_response.json()["exercises"][0]
        assert exercise_data["is_completed"] is False

    @pytest.mark.asyncio
    async def test_update_set_not_found(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_ex = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        se_id = add_ex.json()["id"]
        response = await user_client.patch(
            f"{BASE}/{session_id}/exercises/{se_id}/sets/99999",
            json={"reps": 5},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_set_not_found(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_ex = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        se_id = add_ex.json()["id"]
        response = await user_client.delete(
            f"{BASE}/{session_id}/exercises/{se_id}/sets/99999"
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_exercise_not_completed_partial(self, user_client, exercise):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]
        add_ex_response = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        se_id = add_ex_response.json()["id"]

        set1_response = await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 1, "reps": 10, "weight": 80.0},
        )
        await user_client.post(
            f"{BASE}/{session_id}/exercises/{se_id}/sets",
            json={"set_number": 2, "reps": 10, "weight": 80.0},
        )
        set1_id = set1_response.json()["id"]

        await user_client.patch(
            f"{BASE}/{session_id}/exercises/{se_id}/sets/{set1_id}",
            json={"is_completed": True},
        )

        get_response = await user_client.get(f"{BASE}/{session_id}")
        exercise_data = get_response.json()["exercises"][0]
        assert exercise_data["is_completed"] is False


class TestMixedExerciseTypes:
    @pytest.mark.asyncio
    async def test_session_with_mixed_exercise_types(
        self, user_client, exercise, duration_exercise
    ):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]

        # Add weight exercise
        add_weight = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": exercise.id, "sort_order": 0},
        )
        weight_se_id = add_weight.json()["id"]
        await user_client.post(
            f"{BASE}/{session_id}/exercises/{weight_se_id}/sets",
            json={"set_number": 1, "reps": 10, "weight": 80.0},
        )

        # Add duration exercise
        add_duration = await user_client.post(
            f"{BASE}/{session_id}/exercises",
            json={"exercise_id": duration_exercise.id, "sort_order": 1},
        )
        duration_se_id = add_duration.json()["id"]
        await user_client.post(
            f"{BASE}/{session_id}/exercises/{duration_se_id}/sets",
            json={"set_number": 1, "duration": 60},
        )

        get_response = await user_client.get(f"{BASE}/{session_id}")
        data = get_response.json()
        assert len(data["exercises"]) == 2
        weight_ex = next(e for e in data["exercises"] if e["sort_order"] == 0)
        duration_ex = next(e for e in data["exercises"] if e["sort_order"] == 1)
        assert weight_ex["sets"][0]["reps"] == 10
        assert float(weight_ex["sets"][0]["weight"]) == 80.0
        assert duration_ex["sets"][0]["duration"] == 60


class TestMultipleSessionsSameDate:
    @pytest.mark.asyncio
    async def test_multiple_sessions_same_date(self, user_client):
        await user_client.post(BASE, json={"date": "2025-01-15"})
        await user_client.post(BASE, json={"date": "2025-01-15"})
        response = await user_client.get(
            f"{BASE}?date_from=2025-01-15&date_to=2025-01-15"
        )
        assert response.status_code == 200
        assert len(response.json()) == 2


class TestOtherUserCannotAccessSession:
    @pytest.mark.asyncio
    async def test_other_user_cannot_access_session(
        self, user_client, client, session
    ):
        create_response = await user_client.post(BASE, json={})
        session_id = create_response.json()["id"]

        other_user = User(
            username="other",
            email="other@test.com",
            password_hash=hash_password("pass"),
            is_admin=False,
        )
        session.add(other_user)
        await session.flush()
        other_token = create_access_token(other_user.id)

        response = await client.get(
            f"{BASE}/{session_id}",
            headers={"Authorization": f"Bearer {other_token}"},
        )
        assert response.status_code == 404
