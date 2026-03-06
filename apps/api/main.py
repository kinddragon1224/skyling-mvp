from datetime import datetime
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import DateTime, Integer, String, create_engine, desc
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

DATABASE_URL = "sqlite:///./skyling.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


class Base(DeclarativeBase):
    pass


class Pet(Base):
    __tablename__ = "pets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
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
    action: Mapped[str] = mapped_column(String(20))
    message: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


def ensure_schema() -> None:
    with engine.begin() as conn:
        cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(pets)").fetchall()]
        if "level" not in cols:
            conn.exec_driver_sql("ALTER TABLE pets ADD COLUMN level INTEGER DEFAULT 1")
        if "stage" not in cols:
            conn.exec_driver_sql("ALTER TABLE pets ADD COLUMN stage INTEGER DEFAULT 1")


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
    action: Literal["pray", "study", "record"]


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
        "name": pet.name,
        "hp": pet.hp,
        "mood": pet.mood,
        "bond": pet.bond,
        "growth": pet.growth,
        "level": pet.level,
        "stage": pet.stage,
    }


def last_memories(db: Session, pet_id: int):
    rows = (
        db.query(ActionLog)
        .filter(ActionLog.pet_id == pet_id)
        .order_by(desc(ActionLog.created_at))
        .limit(3)
        .all()
    )
    return [r.message for r in rows]


@app.get("/pet/me")
def get_pet_me():
    with Session(engine) as db:
        pet = db.query(Pet).first()
        if not pet:
            raise HTTPException(status_code=404, detail="pet not found")
        apply_growth_progression(pet)
        db.commit()
        db.refresh(pet)
        return {"pet": pet_to_dict(pet), "memories": last_memories(db, pet.id)}


@app.post("/pet/create")
def create_pet():
    with Session(engine) as db:
        existing = db.query(Pet).first()
        if existing:
            apply_growth_progression(existing)
            db.commit()
            db.refresh(existing)
            return {"pet": pet_to_dict(existing), "message": "이미 하늘이가 있어!", "memories": last_memories(db, existing.id)}
        pet = Pet(name="하늘이")
        db.add(pet)
        db.commit()
        db.refresh(pet)
        msg = "하늘이가 태어났어! 오늘 첫 행동을 해보자."
        db.add(ActionLog(pet_id=pet.id, action="create", message=msg))
        db.commit()
        return {"pet": pet_to_dict(pet), "message": msg, "memories": last_memories(db, pet.id)}


@app.post("/pet/action")
def do_action(payload: ActionIn):
    with Session(engine) as db:
        pet = db.query(Pet).first()
        if not pet:
            raise HTTPException(status_code=404, detail="pet not found")

        if payload.action == "pray":
            pet.mood = clamp(pet.mood + 6)
            pet.bond = clamp(pet.bond + 4)
            pet.growth = clamp(pet.growth + 2)
            message = "기도했네. 마음이 차분해졌어."
        elif payload.action == "study":
            pet.hp = clamp(pet.hp - 2)
            pet.growth = clamp(pet.growth + 7)
            pet.bond = clamp(pet.bond + 2)
            message = "공부 완료! 하늘이의 의지가 자랐어."
        else:
            pet.mood = clamp(pet.mood + 3)
            pet.bond = clamp(pet.bond + 5)
            pet.growth = clamp(pet.growth + 4)
            message = "기록을 남겼어. 하늘이가 오늘을 기억할게."

        apply_growth_progression(pet)

        db.add(ActionLog(pet_id=pet.id, action=payload.action, message=message))
        db.commit()
        db.refresh(pet)
        return {"pet": pet_to_dict(pet), "message": message, "memories": last_memories(db, pet.id)}
