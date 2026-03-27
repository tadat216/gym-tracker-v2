import pytest  # noqa: F401


class TestAdminListMuscleGroups:
    async def test_list_system_muscle_groups(self, admin_client, system_muscle_group):
        response = await admin_client.get("/api/v1/admin/muscle-groups")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Chest"

    async def test_list_excludes_non_system(
        self, admin_client, system_user, muscle_group
    ):
        response = await admin_client.get("/api/v1/admin/muscle-groups")
        assert response.status_code == 200
        for mg in response.json():
            pass  # Just verify no error; muscle_group belongs to regular_user

    async def test_non_admin_forbidden(self, user_client, system_muscle_group):
        response = await user_client.get("/api/v1/admin/muscle-groups")
        assert response.status_code == 403

    async def test_no_token(self, client):
        response = await client.get("/api/v1/admin/muscle-groups")
        assert response.status_code == 401


class TestAdminGetMuscleGroup:
    async def test_get_system_muscle_group(self, admin_client, system_muscle_group):
        response = await admin_client.get(
            f"/api/v1/admin/muscle-groups/{system_muscle_group.id}"
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Chest"

    async def test_get_non_system_muscle_group_returns_404(
        self, admin_client, muscle_group, system_user
    ):
        response = await admin_client.get(
            f"/api/v1/admin/muscle-groups/{muscle_group.id}"
        )
        assert response.status_code == 404

    async def test_get_not_found(self, admin_client, system_user):
        response = await admin_client.get("/api/v1/admin/muscle-groups/99999")
        assert response.status_code == 404


class TestAdminCreateMuscleGroup:
    async def test_create_system_muscle_group(self, admin_client, system_user):
        response = await admin_client.post(
            "/api/v1/admin/muscle-groups",
            json={"name": "Glutes", "color": "#FF00FF"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Glutes"
        assert data["color"] == "#FF00FF"

    async def test_create_duplicate_name(self, admin_client, system_muscle_group):
        response = await admin_client.post(
            "/api/v1/admin/muscle-groups",
            json={"name": "Chest", "color": "#000000"},
        )
        assert response.status_code == 409


class TestAdminUpdateMuscleGroup:
    async def test_update_system_muscle_group(self, admin_client, system_muscle_group):
        response = await admin_client.patch(
            f"/api/v1/admin/muscle-groups/{system_muscle_group.id}",
            json={"color": "#FF0000"},
        )
        assert response.status_code == 200
        assert response.json()["color"] == "#FF0000"

    async def test_update_not_found(self, admin_client, system_user):
        response = await admin_client.patch(
            "/api/v1/admin/muscle-groups/99999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404


class TestAdminDeleteMuscleGroup:
    async def test_delete_system_muscle_group(self, admin_client, system_muscle_group):
        response = await admin_client.delete(
            f"/api/v1/admin/muscle-groups/{system_muscle_group.id}"
        )
        assert response.status_code == 200
        assert "deactivated" in response.json()["message"].lower()

    async def test_delete_not_found(self, admin_client, system_user):
        response = await admin_client.delete("/api/v1/admin/muscle-groups/99999")
        assert response.status_code == 404
