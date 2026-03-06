import random
from datetime import datetime
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy import DateTime, Integer, String, create_engine, desc
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

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

    last_action = today_rows[0] if today_rows else None
    return {
        "today": counts,
        "last_action": {
            "action": last_action.action,
            "created_at": last_action.created_at.isoformat(),
        }
        if last_action
        else None,
    }


def interpret_today(counts: dict[str, int]):
    total = sum(counts.values())
    if total == 0:
        return "오늘은 멈춤에 가까운 날이야. 쉬어도 괜찮아."

    top_action = max(counts, key=counts.get)
    if top_action == "study":
        return "오늘은 앞으로 나아가려는 기운이 보여."
    if top_action == "record":
        return "오늘은 마음을 남기고 관계를 쌓는 날 같아."
    if top_action == "pray":
        return "오늘은 조용히 머물며 중심을 잡는 날이야."
    return "오늘은 잔잔하지만 분명한 흐름이 있어."


def interpret_state_combo(pet: Pet, counts: dict[str, int]):
    total = sum(counts.values())
    if pet.hp <= 35 and pet.bond >= 65:
        return "지쳤지만 서로 곁에 머무는 감각이 있어."
    if pet.mood >= 70 and pet.growth >= 60:
        return "기분과 성장이 함께 오르는 좋은 흐름이야."
    if pet.growth >= 70 and total <= 1:
        return "적게 움직였어도 깊게 남긴 하루였어."
    if pet.bond >= 70 and counts["record"] >= 2:
        return "기억을 쌓으며 관계가 단단해지고 있어."
    return "오늘의 움직임이 조금씩 너와 나를 바꾸고 있어."


def build_memory_text(action: Literal["pray", "study", "record"], pet: Pet, counts: dict[str, int]) -> str:
    tone = interpret_today(counts)
    combo = interpret_state_combo(pet, counts)

    action_lines = {
        "pray": [
            "오늘 넌 숨을 고르고 마음을 가다듬었어.",
            "짧은 기도였지만 내 안엔 오래 남았어.",
        ],
        "study": [
            "오늘의 공부는 서두름보다 의지에 가까웠어.",
            "넌 한 걸음씩 앞으로 가는 법을 선택했어.",
        ],
        "record": [
            "오늘 넌 마음의 흔적을 내게 맡겼어.",
            "남겨둔 문장들이 우리 사이를 채우고 있어.",
        ],
    }

    base = random.choice(action_lines[action])
    if random.random() < 0.5:
        return f"{base} {tone}"
    return f"{base} {combo}"


def build_daily_report(pet: Pet, counts: dict[str, int]):
    total = sum(counts.values())
    line1 = interpret_today(counts)

    if pet.growth >= 70 or pet.level >= 3:
        line2 = "나는 오늘, 자라는 속도를 스스로 느끼기 시작했어."
    elif pet.bond >= 65:
        line2 = "나는 오늘, 네 곁에 머무는 법을 조금 더 배웠어."
    else:
        line2 = "나는 오늘, 너의 리듬을 기억하는 법을 연습했어."

    if total == 0:
        line3 = "내일은 아주 작은 행동 하나만 남겨줘도 충분해."
    elif counts["record"] == 0:
        line3 = "내일은 짧은 기록 한 줄로 오늘을 봉인해보자."
    elif counts["study"] == 0:
        line3 = "내일은 아주 짧은 공부 한 번으로 길을 열어보자."
    else:
        line3 = "내일도 한 번만 더, 우리 흐름을 이어가 보자."

    return [line1, line2, line3]


def payload(db: Session, pet: Pet, guest_id: str, message: str | None = None):
    activity = activity_summary(db, guest_id)
    interpretation = {
        "today": interpret_today(activity["today"]),
        "state": interpret_state_combo(pet, activity["today"]),
    }
    base = {
        "pet": pet_to_dict(pet),
        "memories": recent_memories(db, guest_id),
        "activity": activity,
        "interpretation": interpretation,
        "daily_report": build_daily_report(pet, activity["today"]),
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

        if body.action == "pray":
            pet.mood = clamp(pet.mood + 6)
            pet.bond = clamp(pet.bond + 4)
            pet.growth = clamp(pet.growth + 2)
        elif body.action == "study":
            pet.hp = clamp(pet.hp - 2)
            pet.growth = clamp(pet.growth + 7)
            pet.bond = clamp(pet.bond + 2)
        else:
            pet.mood = clamp(pet.mood + 3)
            pet.bond = clamp(pet.bond + 5)
            pet.growth = clamp(pet.growth + 4)

        apply_growth_progression(pet)

        counts = activity_summary(db, body.guest_id)["today"]
        counts[body.action] += 1
        message = build_memory_text(body.action, pet, counts)

        db.add(
            ActionLog(
                pet_id=pet.id,
                guest_id=body.guest_id,
                action=body.action,
                message=message,
            )
        )
        db.commit()
        db.refresh(pet)
        return payload(db, pet, body.guest_id, message)
