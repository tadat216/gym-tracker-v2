import pytest

from app.models.muscle_group import MuscleGroup
from app.schemas.muscle_group import MuscleGroupCreate, MuscleGroupUpdate
from app.services.exceptions import DuplicateNameError, NotFoundError
from app.services.muscle_group import MuscleGroupService


class TestMuscleGroupServiceList:
    async def test_list_returns_active_groups(
        self, session, regular_user, muscle_group
    ):
        svc = MuscleGroupService(session, regular_user.id)
        result = await svc.list()
        assert len(result) == 1
        assert result[0].name == "Chest"

    async def test_list_excludes_inactive(self, session, regular_user, muscle_group):
        muscle_group.is_active = False
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        result = await svc.list()
        assert len(result) == 0

    async def test_list_scoped_to_user(self, session, regular_user, admin_user):
        mg = MuscleGroup(name="Other", color="#000000", user_id=admin_user.id)
        session.add(mg)
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        result = await svc.list()
        assert len(result) == 0

    async def test_list_sorted_by_name(self, session, regular_user):
        session.add(MuscleGroup(name="Zzz", color="#000000", user_id=regular_user.id))
        session.add(MuscleGroup(name="Aaa", color="#111111", user_id=regular_user.id))
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        result = await svc.list()
        assert [r.name for r in result] == ["Aaa", "Zzz"]


class TestMuscleGroupServiceGet:
    async def test_get_returns_group(self, session, regular_user, muscle_group):
        svc = MuscleGroupService(session, regular_user.id)
        result = await svc.get(muscle_group.id)
        assert result.name == "Chest"

    async def test_get_not_found(self, session, regular_user):
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.get(99999)

    async def test_get_other_user(self, session, regular_user, admin_user):
        mg = MuscleGroup(name="Other", color="#000000", user_id=admin_user.id)
        session.add(mg)
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.get(mg.id)


class TestMuscleGroupServiceCreate:
    async def test_create(self, session, regular_user):
        svc = MuscleGroupService(session, regular_user.id)
        mg = await svc.create(MuscleGroupCreate(name="Arms", color="#FF0000"))
        assert mg.name == "Arms"
        assert mg.color == "#FF0000"
        assert mg.user_id == regular_user.id

    async def test_create_duplicate_name(self, session, regular_user, muscle_group):
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(DuplicateNameError):
            await svc.create(MuscleGroupCreate(name="Chest", color="#000000"))

    async def test_create_reuse_deleted_name(self, session, regular_user, muscle_group):
        muscle_group.is_active = False
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        mg = await svc.create(MuscleGroupCreate(name="Chest", color="#00FF00"))
        assert mg.name == "Chest"


class TestMuscleGroupServiceUpdate:
    async def test_update(self, session, regular_user, muscle_group):
        svc = MuscleGroupService(session, regular_user.id)
        mg = await svc.update(muscle_group.id, MuscleGroupUpdate(name="Upper Chest"))
        assert mg.name == "Upper Chest"
        assert mg.color == "#EF4444"

    async def test_update_not_found(self, session, regular_user):
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.update(99999, MuscleGroupUpdate(name="Nope"))

    async def test_update_duplicate_name(self, session, regular_user, muscle_group):
        mg2 = MuscleGroup(name="Back", color="#0000FF", user_id=regular_user.id)
        session.add(mg2)
        await session.flush()
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(DuplicateNameError):
            await svc.update(mg2.id, MuscleGroupUpdate(name="Chest"))


class TestMuscleGroupServiceDelete:
    async def test_delete(self, session, regular_user, muscle_group):
        svc = MuscleGroupService(session, regular_user.id)
        mg = await svc.delete(muscle_group.id)
        assert mg.is_active is False

    async def test_delete_not_found(self, session, regular_user):
        svc = MuscleGroupService(session, regular_user.id)
        with pytest.raises(NotFoundError):
            await svc.delete(99999)
