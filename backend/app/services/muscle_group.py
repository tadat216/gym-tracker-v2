from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.muscle_group import MuscleGroup
from app.schemas.muscle_group import MuscleGroupCreate, MuscleGroupUpdate
from app.services.exceptions import DuplicateNameError, NotFoundError


class MuscleGroupService:
    def __init__(self, session: AsyncSession, user_id: int):
        self.session = session
        self.user_id = user_id

    async def list(self) -> list[MuscleGroup]:
        result = await self.session.execute(
            select(MuscleGroup)
            .where(
                MuscleGroup.user_id == self.user_id,
                MuscleGroup.is_active == True,  # noqa: E712
            )
            .order_by(MuscleGroup.name)
        )
        return list(result.scalars().all())

    async def get(self, muscle_group_id: int) -> MuscleGroup:
        result = await self.session.execute(
            select(MuscleGroup).where(
                MuscleGroup.id == muscle_group_id,
                MuscleGroup.user_id == self.user_id,
                MuscleGroup.is_active == True,  # noqa: E712
            )
        )
        mg = result.scalar_one_or_none()
        if mg is None:
            raise NotFoundError("Muscle group")
        return mg

    async def create(self, data: MuscleGroupCreate) -> MuscleGroup:
        await self._check_duplicate_name(data.name)
        mg = MuscleGroup(
            name=data.name,
            color=data.color,
            user_id=self.user_id,
        )
        self.session.add(mg)
        await self.session.flush()
        return mg

    async def update(
        self, muscle_group_id: int, data: MuscleGroupUpdate
    ) -> MuscleGroup:
        mg = await self.get(muscle_group_id)
        update_data = data.model_dump(exclude_unset=True)
        if "name" in update_data:
            await self._check_duplicate_name(
                update_data["name"], exclude_id=muscle_group_id
            )
        for key, value in update_data.items():
            setattr(mg, key, value)
        await self.session.flush()
        return mg

    async def delete(self, muscle_group_id: int) -> MuscleGroup:
        mg = await self.get(muscle_group_id)
        mg.is_active = False
        await self.session.flush()
        return mg

    async def _check_duplicate_name(
        self, name: str, *, exclude_id: int | None = None
    ) -> None:
        query = select(MuscleGroup).where(
            MuscleGroup.user_id == self.user_id,
            MuscleGroup.name == name,
            MuscleGroup.is_active == True,  # noqa: E712
        )
        if exclude_id is not None:
            query = query.where(MuscleGroup.id != exclude_id)
        result = await self.session.execute(query)
        if result.scalar_one_or_none() is not None:
            raise DuplicateNameError("Muscle group", name)
