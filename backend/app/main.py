from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select

from app.auth.password import hash_password
from app.config import settings
from app.database import async_session
from app.models.user import User
from app.routes.admin_exercises import router as admin_exercises_router
from app.routes.admin_muscle_groups import router as admin_muscle_groups_router
from app.routes.auth import router as auth_router
from app.routes.exercises import router as exercises_router
from app.routes.muscle_groups import router as muscle_groups_router
from app.routes.users import router as users_router
from app.routes.workout_plans import router as workout_plans_router
from app.routes.workout_sessions import router as workout_sessions_router
from app.seed import create_system_user, seed_test_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_session() as session:
        # Create system user with seed data
        await create_system_user(session)

        # Create admin user if none exists
        result = await session.execute(
            select(User).where(User.is_admin == True)  # noqa: E712
        )
        if result.scalar_one_or_none() is None:
            admin = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                is_admin=True,
            )
            session.add(admin)

        await session.commit()

    async with async_session() as session:
        await seed_test_user(session)

    yield


app = FastAPI(title="Gym Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(muscle_groups_router)
app.include_router(exercises_router)
app.include_router(admin_muscle_groups_router)
app.include_router(admin_exercises_router)
app.include_router(workout_plans_router)
app.include_router(workout_sessions_router)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
