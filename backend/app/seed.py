from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.password import hash_password
from app.models.exercise import Exercise, ExerciseType
from app.models.muscle_group import MuscleGroup
from app.models.plan_exercise import PlanExercise
from app.models.user import User
from app.models.workout_plan import WorkoutPlan

SEED_MUSCLE_GROUPS = [
    {"name": "Chest", "color": "#EF4444"},
    {"name": "Lats", "color": "#3B82F6"},
    {"name": "Upper Back", "color": "#0EA5E9"},
    {"name": "Shoulders", "color": "#F59E0B"},
    {"name": "Biceps", "color": "#8B5CF6"},
    {"name": "Triceps", "color": "#EC4899"},
    {"name": "Quads", "color": "#10B981"},
    {"name": "Hamstrings", "color": "#14B8A6"},
    {"name": "Calves", "color": "#059669"},
    {"name": "Core", "color": "#6366F1"},
    {"name": "Cardio", "color": "#F97316"},
]

SEED_EXERCISES = [
    # Chest
    {"name": "Bench Press", "type": "weight", "muscle_group": "Chest"},
    {"name": "Dumbbell Press", "type": "weight", "muscle_group": "Chest"},
    {"name": "Incline Dumbbell Press", "type": "weight", "muscle_group": "Chest"},
    {"name": "Push-ups", "type": "bodyweight", "muscle_group": "Chest"},
    {"name": "Cable Fly", "type": "weight", "muscle_group": "Chest"},
    {"name": "Machine Fly", "type": "weight", "muscle_group": "Chest"},
    # Lats
    {"name": "Pull-ups", "type": "bodyweight", "muscle_group": "Lats"},
    {"name": "Lat Pulldown", "type": "weight", "muscle_group": "Lats"},
    {"name": "Seated Cable Row", "type": "weight", "muscle_group": "Lats"},
    {"name": "Dumbbell Row", "type": "weight", "muscle_group": "Lats"},
    {"name": "Machine Close Grip Row", "type": "weight", "muscle_group": "Lats"},
    # Upper Back
    {"name": "Barbell Row", "type": "weight", "muscle_group": "Upper Back"},
    {"name": "Face Pull", "type": "weight", "muscle_group": "Upper Back"},
    {"name": "Shrugs", "type": "weight", "muscle_group": "Upper Back"},
    {"name": "Machine High Grip Row", "type": "weight", "muscle_group": "Upper Back"},
    # Shoulders
    {"name": "Overhead Press", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Overhead Press Machine", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Lateral Raise", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Lateral Cable Raise", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Front Raise", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Reverse Fly", "type": "weight", "muscle_group": "Shoulders"},
    {"name": "Reverse Cable Fly", "type": "weight", "muscle_group": "Shoulders"},
    # Biceps
    {"name": "Barbell Curl", "type": "weight", "muscle_group": "Biceps"},
    {"name": "Dumbbell Curl", "type": "weight", "muscle_group": "Biceps"},
    {"name": "Hammer Curl", "type": "weight", "muscle_group": "Biceps"},
    {"name": "Cable Barbell Curl", "type": "weight", "muscle_group": "Biceps"},
    {"name": "Cable Dumbbell Curl", "type": "weight", "muscle_group": "Biceps"},
    {"name": "Cable Hammer Curl", "type": "weight", "muscle_group": "Biceps"},
    # Triceps
    {"name": "Tricep Pushdown", "type": "weight", "muscle_group": "Triceps"},
    {"name": "Skull Crusher", "type": "weight", "muscle_group": "Triceps"},
    {"name": "Dips", "type": "bodyweight", "muscle_group": "Triceps"},
    {"name": "Cable Tricep Pushdown", "type": "weight", "muscle_group": "Triceps"},
    {
        "name": "Cable Overhead Tricep Extension",
        "type": "weight",
        "muscle_group": "Triceps",
    },
    # Quads
    {"name": "Squat", "type": "weight", "muscle_group": "Quads"},
    {"name": "Leg Press", "type": "weight", "muscle_group": "Quads"},
    {"name": "Leg Extension", "type": "weight", "muscle_group": "Quads"},
    {"name": "Bulgarian Split Squat", "type": "weight", "muscle_group": "Quads"},
    # Hamstrings
    {"name": "Romanian Deadlift", "type": "weight", "muscle_group": "Hamstrings"},
    {"name": "Leg Curl", "type": "weight", "muscle_group": "Hamstrings"},
    {"name": "Good Morning", "type": "weight", "muscle_group": "Hamstrings"},
    # Calves
    {"name": "Standing Calf Raise", "type": "weight", "muscle_group": "Calves"},
    {"name": "Seated Calf Raise", "type": "weight", "muscle_group": "Calves"},
    # Core
    {"name": "Plank", "type": "duration", "muscle_group": "Core"},
    {"name": "Hanging Leg Raise", "type": "bodyweight", "muscle_group": "Core"},
    {"name": "Ab Wheel Rollout", "type": "bodyweight", "muscle_group": "Core"},
    {"name": "Cable Crunch", "type": "weight", "muscle_group": "Core"},
    # Cardio
    {"name": "Treadmill", "type": "duration", "muscle_group": "Cardio"},
    {"name": "Jump Rope", "type": "duration", "muscle_group": "Cardio"},
]


async def create_system_user(session: AsyncSession) -> User:
    """Create or return the system user with seeded muscle groups and exercises."""
    result = await session.execute(select(User).where(User.username == "system"))
    existing = result.scalar_one_or_none()
    if existing is not None:
        return existing

    system_user = User(
        username="system",
        email="system@system",
        password_hash="",
        is_system=True,
    )
    session.add(system_user)
    await session.flush()

    group_map: dict[str, int] = {}
    for g in SEED_MUSCLE_GROUPS:
        mg = MuscleGroup(name=g["name"], color=g["color"], user_id=system_user.id)
        session.add(mg)
        await session.flush()
        group_map[g["name"]] = mg.id

    for ex in SEED_EXERCISES:
        exercise = Exercise(
            name=ex["name"],
            type=ExerciseType(ex["type"]),
            muscle_group_id=group_map[ex["muscle_group"]],
            user_id=system_user.id,
        )
        session.add(exercise)

    await session.flush()
    return system_user


async def copy_defaults_to_user(
    session: AsyncSession, system_user_id: int, target_user_id: int
) -> None:
    """Copy system user's active muscle groups and exercises to a target user."""
    source_groups = (
        (
            await session.execute(
                select(MuscleGroup).where(
                    MuscleGroup.user_id == system_user_id,
                    MuscleGroup.is_active == True,  # noqa: E712
                )
            )
        )
        .scalars()
        .all()
    )

    group_id_map: dict[int, int] = {}
    for sg in source_groups:
        new_group = MuscleGroup(
            name=sg.name,
            color=sg.color,
            user_id=target_user_id,
        )
        session.add(new_group)
        await session.flush()
        group_id_map[sg.id] = new_group.id

    source_exercises = (
        (
            await session.execute(
                select(Exercise).where(
                    Exercise.user_id == system_user_id,
                    Exercise.is_active == True,  # noqa: E712
                )
            )
        )
        .scalars()
        .all()
    )

    for se in source_exercises:
        new_exercise = Exercise(
            name=se.name,
            type=se.type,
            muscle_group_id=group_id_map[se.muscle_group_id],
            user_id=target_user_id,
        )
        session.add(new_exercise)

    await session.flush()


SEED_USERNAME = "testuser"
SEED_EMAIL = "testuser@example.com"
SEED_PASSWORD = "password123"

SEED_PLANS = [
    {
        "name": "Push Day",
        "exercises": [
            "Bench Press",
            "Incline Dumbbell Press",
            "Overhead Press",
            "Lateral Raise",
            "Tricep Pushdown",
            "Cable Overhead Tricep Extension",
        ],
    },
    {
        "name": "Pull Day",
        "exercises": [
            "Pull-ups",
            "Lat Pulldown",
            "Seated Cable Row",
            "Face Pull",
            "Barbell Curl",
            "Hammer Curl",
        ],
    },
    {
        "name": "Leg Day",
        "exercises": [
            "Squat",
            "Leg Press",
            "Romanian Deadlift",
            "Leg Extension",
            "Leg Curl",
            "Standing Calf Raise",
        ],
    },
]


async def seed_test_user(session: AsyncSession) -> None:
    """Create a test user with workout plans. Deletes and recreates if exists."""
    # Delete existing test user and all related data
    result = await session.execute(select(User).where(User.username == SEED_USERNAME))
    existing = result.scalar_one_or_none()
    if existing is not None:
        uid = existing.id
        # Delete plan exercises via plans owned by this user
        user_plans = (
            (
                await session.execute(
                    select(WorkoutPlan.id).where(WorkoutPlan.user_id == uid)
                )
            )
            .scalars()
            .all()
        )
        if user_plans:
            await session.execute(
                delete(PlanExercise).where(
                    PlanExercise.plan_id.in_(user_plans)  # type: ignore[union-attr]
                )
            )
        await session.execute(delete(WorkoutPlan).where(WorkoutPlan.user_id == uid))
        await session.execute(delete(Exercise).where(Exercise.user_id == uid))
        await session.execute(delete(MuscleGroup).where(MuscleGroup.user_id == uid))
        await session.delete(existing)
        await session.flush()

    # Create user
    user = User(
        username=SEED_USERNAME,
        email=SEED_EMAIL,
        password_hash=hash_password(SEED_PASSWORD),
    )
    session.add(user)
    await session.flush()

    # Copy default muscle groups and exercises
    system_result = await session.execute(select(User).where(User.username == "system"))
    system_user = system_result.scalar_one_or_none()
    if system_user is None:
        system_user = await create_system_user(session)
    assert system_user.id is not None
    assert user.id is not None
    await copy_defaults_to_user(session, system_user.id, user.id)

    # Build exercise name → id map for this user
    user_exercises = (
        (await session.execute(select(Exercise).where(Exercise.user_id == user.id)))
        .scalars()
        .all()
    )
    exercise_map = {ex.name: ex.id for ex in user_exercises}

    # Create workout plans
    for plan_data in SEED_PLANS:
        plan = WorkoutPlan(name=plan_data["name"], user_id=user.id)
        session.add(plan)
        await session.flush()

        for order, ex_name in enumerate(plan_data["exercises"]):
            if ex_name in exercise_map:
                pe = PlanExercise(
                    plan_id=plan.id,
                    exercise_id=exercise_map[ex_name],
                    sort_order=order,
                )
                session.add(pe)

    await session.flush()
    await session.commit()
