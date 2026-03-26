from sqlmodel import select

from app.models.exercise import Exercise
from app.models.muscle_group import MuscleGroup
from app.models.user import User
from app.seed import (
    SEED_EXERCISES,
    SEED_MUSCLE_GROUPS,
    copy_defaults_to_user,
    create_system_user,
)


class TestSeedData:
    async def test_seed_data_constants_valid(self):
        """All exercises should reference valid groups."""
        assert len(SEED_MUSCLE_GROUPS) == 11
        group_names = {g["name"] for g in SEED_MUSCLE_GROUPS}
        for ex in SEED_EXERCISES:
            assert ex["muscle_group"] in group_names, (
                f"{ex['name']} references unknown group"
            )
            assert ex["type"] in ("weight", "bodyweight", "duration")

    async def test_create_system_user(self, session):
        """create_system_user should create the system user with seed data."""
        system_user = await create_system_user(session)

        assert system_user.username == "system"
        assert system_user.is_system is True
        assert system_user.password_hash == ""

        groups = (
            (
                await session.execute(
                    select(MuscleGroup).where(MuscleGroup.user_id == system_user.id)
                )
            )
            .scalars()
            .all()
        )
        assert len(groups) == 11

        exercises = (
            (
                await session.execute(
                    select(Exercise).where(Exercise.user_id == system_user.id)
                )
            )
            .scalars()
            .all()
        )
        assert len(exercises) == len(SEED_EXERCISES)

    async def test_create_system_user_idempotent(self, session):
        """Calling create_system_user twice should return the same user."""
        user1 = await create_system_user(session)
        user2 = await create_system_user(session)
        assert user1.id == user2.id

    async def test_copy_defaults_to_user(self, session):
        """copy_defaults_to_user should copy system user's data to a new user."""
        system_user = await create_system_user(session)

        new_user = User(
            username="newguy",
            email="new@test.com",
            password_hash="hash",
        )
        session.add(new_user)
        await session.flush()

        await copy_defaults_to_user(session, system_user.id, new_user.id)

        groups = (
            (
                await session.execute(
                    select(MuscleGroup).where(MuscleGroup.user_id == new_user.id)
                )
            )
            .scalars()
            .all()
        )
        assert len(groups) == 11

        exercises = (
            (
                await session.execute(
                    select(Exercise).where(Exercise.user_id == new_user.id)
                )
            )
            .scalars()
            .all()
        )
        assert len(exercises) == len(SEED_EXERCISES)

        # Verify exercises point to the new user's muscle groups, not the system user's
        new_group_ids = {g.id for g in groups}
        for ex in exercises:
            assert ex.user_id == new_user.id
            assert ex.muscle_group_id in new_group_ids
