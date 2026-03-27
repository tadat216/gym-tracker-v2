import pytest  # noqa: F401

from app.models.muscle_group import MuscleGroup


class TestListMuscleGroups:
    async def test_list_muscle_groups(self, user_client, muscle_group):
        response = await user_client.get("/api/v1/muscle-groups")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Chest"
        assert data[0]["color"] == "#EF4444"
        assert data[0]["is_active"] is True
        assert "created_at" in data[0]

    async def test_list_muscle_groups_excludes_inactive(
        self, user_client, muscle_group, session
    ):
        muscle_group.is_active = False
        await session.flush()
        response = await user_client.get("/api/v1/muscle-groups")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_muscle_groups_scoped_to_user(
        self, user_client, session, admin_user
    ):
        other_mg = MuscleGroup(name="Other", color="#000000", user_id=admin_user.id)
        session.add(other_mg)
        await session.flush()
        response = await user_client.get("/api/v1/muscle-groups")
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_list_muscle_groups_no_token(self, client):
        response = await client.get("/api/v1/muscle-groups")
        assert response.status_code == 401


class TestGetMuscleGroup:
    async def test_get_muscle_group(self, user_client, muscle_group):
        response = await user_client.get(f"/api/v1/muscle-groups/{muscle_group.id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Chest"

    async def test_get_muscle_group_not_found(self, user_client):
        response = await user_client.get("/api/v1/muscle-groups/99999")
        assert response.status_code == 404

    async def test_get_muscle_group_other_user(self, user_client, session, admin_user):
        other_mg = MuscleGroup(name="Other", color="#000000", user_id=admin_user.id)
        session.add(other_mg)
        await session.flush()
        response = await user_client.get(f"/api/v1/muscle-groups/{other_mg.id}")
        assert response.status_code == 404


class TestCreateMuscleGroup:
    async def test_create_muscle_group(self, user_client):
        response = await user_client.post(
            "/api/v1/muscle-groups",
            json={"name": "Arms", "color": "#FF0000"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Arms"
        assert data["color"] == "#FF0000"
        assert data["is_active"] is True
        assert "id" in data

    async def test_create_muscle_group_duplicate_name(self, user_client, muscle_group):
        response = await user_client.post(
            "/api/v1/muscle-groups",
            json={"name": "Chest", "color": "#000000"},
        )
        assert response.status_code == 409

    async def test_create_muscle_group_reuse_deleted_name(
        self, user_client, muscle_group
    ):
        await user_client.delete(f"/api/v1/muscle-groups/{muscle_group.id}")
        response = await user_client.post(
            "/api/v1/muscle-groups",
            json={"name": "Chest", "color": "#00FF00"},
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Chest"


class TestUpdateMuscleGroup:
    async def test_update_muscle_group(self, user_client, muscle_group):
        response = await user_client.patch(
            f"/api/v1/muscle-groups/{muscle_group.id}",
            json={"name": "Upper Chest"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Upper Chest"
        assert response.json()["color"] == "#EF4444"

    async def test_update_muscle_group_not_found(self, user_client):
        response = await user_client.patch(
            "/api/v1/muscle-groups/99999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404

    async def test_update_muscle_group_duplicate_name(
        self, user_client, muscle_group, session, regular_user
    ):
        mg2 = MuscleGroup(name="Back", color="#0000FF", user_id=regular_user.id)
        session.add(mg2)
        await session.flush()
        response = await user_client.patch(
            f"/api/v1/muscle-groups/{mg2.id}",
            json={"name": "Chest"},
        )
        assert response.status_code == 409


class TestDeleteMuscleGroup:
    async def test_delete_muscle_group(self, user_client, muscle_group):
        response = await user_client.delete(f"/api/v1/muscle-groups/{muscle_group.id}")
        assert response.status_code == 200
        assert "deactivated" in response.json()["message"].lower()

        # Verify soft deleted — should not appear in list
        list_response = await user_client.get("/api/v1/muscle-groups")
        assert len(list_response.json()) == 0

    async def test_delete_muscle_group_not_found(self, user_client):
        response = await user_client.delete("/api/v1/muscle-groups/99999")
        assert response.status_code == 404
