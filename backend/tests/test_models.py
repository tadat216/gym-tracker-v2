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
