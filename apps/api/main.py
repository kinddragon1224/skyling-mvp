from datetime import datetime
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy import DateTime, Integer, String, create_engine, desc
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

from interaction_engine import build_interaction_snapshot, build_relational_memory, classify_flow

DATABASE_URL = "sqlite:///./skyling.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


class Base(DeclarativeBase):
    pass


class Pet(Base):
    __tablename__ = "pets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    guest_id: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(50), default="하늘이")
    hp: Mapped[int] = mapped_column(Integer, default=50)
    mood: Mapped[int] = mapped_column(Integer, default=50)
    bond: Mapped[int] = mapped_column(Integer, default=30)
    growth: Mapped[int] = mapped_column(Integer, default=10)
    level: Mapped[int] = mapped_column(Integer, default=1)
    stage: Mapped[int] = mapped_column(Integer, default=1)


class ActionLog(Base):
    __tablename__ = "action_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pet_id: Mapped[int] = mapped_column(Integer)
    guest_id: Mapped[str] = mapped_column(String(80), index=True)
    action: Mapped[str] = mapped_column(String(20))
    message: Mapped[str] = mapped_column(String(255))
    note_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    note_mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


def ensure_schema() -> None:
    with engine.begin() as conn:
        pet_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(pets)").fetchall()]
        if "level" not in pet_cols:
            conn.exec_driver_sql("ALTER TABLE pets ADD COLUMN level INTEGER DEFAULT 1")
        if "stage" not in pet_cols:
            conn.exec_driver_sql("ALTER TABLE pets ADD COLUMN stage INTEGER DEFAULT 1")
        if "guest_id" not in pet_cols:
            conn.exec_driver_sql("ALTER TABLE pets ADD COLUMN guest_id TEXT")
            conn.exec_driver_sql("UPDATE pets SET guest_id = 'legacy-default' WHERE guest_id IS NULL")
        conn.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS uq_pets_guest_id ON pets(guest_id)")

        log_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(action_logs)").fetchall()]
        if "guest_id" not in log_cols:
            conn.exec_driver_sql("ALTER TABLE action_logs ADD COLUMN guest_id TEXT")
            conn.exec_driver_sql(
                "UPDATE action_logs SET guest_id = 'legacy-default' WHERE guest_id IS NULL"
            )
        if "note_text" not in log_cols:
            conn.exec_driver_sql("ALTER TABLE action_logs ADD COLUMN note_text TEXT")
        if "note_mood" not in log_cols:
            conn.exec_driver_sql("ALTER TABLE action_logs ADD COLUMN note_mood TEXT")
        conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS idx_action_logs_guest_id_created_at ON action_logs(guest_id, created_at DESC)"
        )


ensure_schema()

app = FastAPI(title="Skyling API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ActionIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    guest_id: str
    action: Literal["pray", "study", "record"]
    record_text: str | None = None
    record_mood: str | None = None


class CreateIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    guest_id: str


def clamp(v: int) -> int:
    return max(0, min(100, v))


def apply_growth_progression(pet: Pet) -> None:
    while pet.growth >= 100:
        pet.level += 1
        pet.growth -= 100
    pet.stage = 2 if pet.level >= 3 else 1


def pet_to_dict(pet: Pet):
    return {
        "id": pet.id,
        "guest_id": pet.guest_id,
        "name": pet.name,
        "hp": pet.hp,
        "mood": pet.mood,
        "bond": pet.bond,
        "growth": pet.growth,
        "level": pet.level,
        "stage": pet.stage,
    }


def recent_memories(db: Session, guest_id: str):
    rows = (
        db.query(ActionLog)
        .filter(ActionLog.guest_id == guest_id)
        .order_by(desc(ActionLog.created_at))
        .limit(3)
        .all()
    )
    return [
        {
            "text": r.message,
            "action": r.action,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


def activity_summary(db: Session, guest_id: str):
    tracked = ["pray", "study", "record"]
    day_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_rows = (
        db.query(ActionLog)
        .filter(
            ActionLog.guest_id == guest_id,
            ActionLog.created_at >= day_start,
            ActionLog.action.in_(tracked),
        )
        .order_by(desc(ActionLog.created_at))
        .all()
    )

    counts = {"pray": 0, "study": 0, "record": 0}
    for row in today_rows:
        if row.action in counts:
            counts[row.action] += 1

    record_with_input = [
        r for r in today_rows if r.action == "record" and ((r.note_text and r.note_text.strip()) or r.note_mood)
    ]
    last_record_input = record_with_input[0] if record_with_input else None

    last_action = today_rows[0] if today_rows else None
    first_action = today_rows[-1] if today_rows else None
    total_actions = sum(counts.values())
    dominant_action = max(counts, key=counts.get) if total_actions > 0 else None

    actions_since_record_input = 99
    if last_record_input:
        for idx, row in enumerate(today_rows):
            if row.id == last_record_input.id:
                actions_since_record_input = idx
                break

    summary = {
        "today": counts,
        "total_actions": total_actions,
        "dominant_action": dominant_action,
        "record_input_count": len(record_with_input),
        "actions_since_record_input": actions_since_record_input,
        "record_resonance": max(0, 2 - actions_since_record_input) if last_record_input else 0,
        "last_record_input": {
            "text": last_record_input.note_text,
            "mood": last_record_input.note_mood,
            "created_at": last_record_input.created_at.isoformat(),
        }
        if last_record_input
        else None,
        "first_action": {
            "action": first_action.action,
            "created_at": first_action.created_at.isoformat(),
        }
        if first_action
        else None,
        "last_action": {
            "action": last_action.action,
            "created_at": last_action.created_at.isoformat(),
        }
        if last_action
        else None,
        "recent_actions": [r.action for r in today_rows[:6]],
    }
    summary["flow_type"] = classify_flow(summary)
    return summary


def action_availability(pet: Pet):
    study_enabled = pet.hp > 10
    return {
        "pray": {"enabled": True, "reason": None},
        "study": {"enabled": study_enabled, "reason": None if study_enabled else "체력이 부족해"},
        "record": {"enabled": True, "reason": None},
    }


def payload(db: Session, pet: Pet, guest_id: str, message: str | None = None):
    memories = recent_memories(db, guest_id)
    activity = activity_summary(db, guest_id)
    snapshot = build_interaction_snapshot(pet, activity, memories, message)

    base = {
        "pet": pet_to_dict(pet),
        "memories": memories,
        "activity": activity,
        "interaction_snapshot": snapshot,
        "action_availability": action_availability(pet),
    }
    if message is not None:
        base["message"] = message
    return base


def get_pet_by_guest(db: Session, guest_id: str) -> Pet | None:
    return db.query(Pet).filter(Pet.guest_id == guest_id).first()


@app.get("/pet/me")
def get_pet_me(guest_id: str = Query(..., min_length=4)):
    with Session(engine) as db:
        pet = get_pet_by_guest(db, guest_id)
        if not pet:
            raise HTTPException(status_code=404, detail="pet not found")
        apply_growth_progression(pet)
        db.commit()
        db.refresh(pet)
        return payload(db, pet, guest_id)


@app.post("/pet/create")
def create_pet(body: CreateIn):
    with Session(engine) as db:
        existing = get_pet_by_guest(db, body.guest_id)
        if existing:
            apply_growth_progression(existing)
            db.commit()
            db.refresh(existing)
            return payload(db, existing, body.guest_id, "이미 하늘이가 있어!")

        pet = Pet(name="하늘이", guest_id=body.guest_id)
        db.add(pet)
        db.commit()
        db.refresh(pet)

        msg = "하늘이가 태어났어! 오늘 첫 행동을 해보자."
        db.add(ActionLog(pet_id=pet.id, guest_id=body.guest_id, action="create", message=msg))
        db.commit()
        return payload(db, pet, body.guest_id, msg)


@app.post("/pet/action")
def do_action(body: ActionIn):
    with Session(engine) as db:
        pet = get_pet_by_guest(db, body.guest_id)
        if not pet:
            raise HTTPException(status_code=404, detail="pet not found")

        activity = activity_summary(db, body.guest_id)
        last_action = activity.get("last_action", {}).get("action") if activity.get("last_action") else None

        repeat_streak = 0
        for act in activity.get("recent_actions", []):
            if act == body.action:
                repeat_streak += 1
            else:
                break

        synergy = None
        if last_action == "pray" and body.action == "study":
            synergy = "pray->study"
        elif last_action == "study" and body.action == "record":
            synergy = "study->record"
        elif last_action == "pray" and body.action == "record":
            synergy = "pray->record"

        if body.action == "pray":
            recover = 6 if pet.hp <= 40 else 3
            recover = max(1, recover - repeat_streak)
            pet.hp = clamp(pet.hp + recover)
            pet.mood = clamp(pet.mood + 3)
            pet.bond = clamp(pet.bond + 2)
            pet.growth = clamp(pet.growth + 0)
        elif body.action == "study":
            if pet.hp <= 10:
                raise HTTPException(status_code=400, detail="체력이 부족해. 지금은 조금 쉬어야 해.")
            growth_gain = 5
            hp_cost = 5
            if synergy == "pray->study":
                growth_gain += 2
                hp_cost = 4
            growth_gain = max(2, growth_gain - max(0, repeat_streak - 1))
            hp_cost += max(0, repeat_streak - 1)

            pet.hp = clamp(pet.hp - hp_cost)
            pet.growth = clamp(pet.growth + growth_gain)
            pet.bond = clamp(pet.bond + 1)
            pet.mood = clamp(pet.mood + 0)
        else:
            has_record_input = bool((body.record_text or "").strip()) or bool(body.record_mood)
            bond_gain = 5 + (2 if has_record_input else 0)
            growth_gain = 1
            mood_gain = 2 + (1 if has_record_input else 0)
            if synergy == "study->record":
                bond_gain += 1
                mood_gain += 1
            if synergy == "pray->record":
                bond_gain += 2
            bond_gain = max(2, bond_gain - max(0, repeat_streak - 1))
            growth_gain = max(0, growth_gain - max(0, repeat_streak - 1))

            pet.mood = clamp(pet.mood + mood_gain)
            pet.bond = clamp(pet.bond + bond_gain)
            pet.growth = clamp(pet.growth + growth_gain)

        apply_growth_progression(pet)

        next_counts = {**activity["today"]}
        next_counts[body.action] += 1
        total_actions = sum(next_counts.values())
        dominant_action = max(next_counts, key=next_counts.get) if total_actions > 0 else None
        has_record_input_now = body.action == "record" and (bool((body.record_text or "").strip()) or bool(body.record_mood))
        next_activity = {
            **activity,
            "today": next_counts,
            "total_actions": total_actions,
            "dominant_action": dominant_action,
            "record_input_count": (activity.get("record_input_count", 0) + 1) if has_record_input_now else activity.get("record_input_count", 0),
            "actions_since_record_input": 0
            if has_record_input_now
            else (activity.get("actions_since_record_input", 99) + 1),
            "record_resonance": 2
            if has_record_input_now
            else max(0, activity.get("record_resonance", 0) - 1),
            "last_record_input": {
                "text": (body.record_text or "").strip() or None,
                "mood": body.record_mood,
                "created_at": datetime.utcnow().isoformat(),
            }
            if has_record_input_now
            else activity.get("last_record_input"),
            "first_action": activity.get("first_action")
            or {"action": body.action, "created_at": datetime.utcnow().isoformat()},
            "last_action": {"action": body.action, "created_at": datetime.utcnow().isoformat()},
            "recent_actions": [body.action, *activity.get("recent_actions", [])][:6],
        }
        next_activity["flow_type"] = classify_flow(next_activity)

        message = build_relational_memory(
            body.action,
            pet,
            next_activity,
            {
                "synergy": synergy,
                "repeat_penalty": max(0, repeat_streak - 1),
                "record_text": (body.record_text or "").strip() or None,
                "record_mood": body.record_mood,
            },
        )

        db.add(
            ActionLog(
                pet_id=pet.id,
                guest_id=body.guest_id,
                action=body.action,
                message=message,
                note_text=(body.record_text or "").strip() or None,
                note_mood=body.record_mood,
            )
        )
        db.commit()
        db.refresh(pet)
        return payload(db, pet, body.guest_id, message)
