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


def pick_reaction(action: Literal["pray", "study", "record"]) -> str:
    templates = {
        "pray": [
            "기도했네. 마음이 차분해졌어.",
            "숨이 고르게 정리됐어. 하늘이도 맑아졌어.",
            "조용히 기도했구나. 오늘의 공기가 조금 더 잔잔해.",
            "짧은 기도였지만 충분했어. 하늘빛이 부드러워졌어.",
        ],
        "study": [
            "공부 완료! 하늘이의 의지가 자랐어.",
            "한 걸음 전진했어. 하늘이도 같이 단단해졌어.",
            "집중한 시간이 쌓였어. 성장의 결이 선명해졌어.",
            "오늘의 학습이 내일의 날개가 돼.",
        ],
        "record": [
            "기록을 남겼어. 하늘이가 오늘을 기억할게.",
            "짧은 기록도 소중해. 우리 기억이 또 하나 쌓였어.",
            "남겨둔 문장이 하늘이의 시간을 채워줘.",
            "오늘의 흔적이 저장됐어. 함께 축적되고 있어.",
        ],
    }
    choices = templates[action]
    if random.random() < 0.65:
        return choices[0]
    return random.choice(choices[1:])


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


def payload(db: Session, pet: Pet, guest_id: str, message: str | None = None):
    base = {
        "pet": pet_to_dict(pet),
        "memories": recent_memories(db, guest_id),
        "activity": activity_summary(db, guest_id),
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
        message = pick_reaction(body.action)

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
