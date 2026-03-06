from __future__ import annotations

import random
from typing import Literal


def interpret_today(counts: dict[str, int]) -> str:
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


def interpret_state_combo(pet, counts: dict[str, int], last_action: str | None = None) -> str:
    total = sum(counts.values())
    if pet.hp <= 35 and pet.bond >= 65:
        return "지쳤지만 서로 곁에 머무는 감각이 있어."
    if pet.mood >= 70 and pet.growth >= 60:
        return "기분과 성장이 함께 오르는 좋은 흐름이야."
    if pet.growth >= 70 and total <= 1:
        return "적게 움직였어도 깊게 남긴 하루였어."
    if pet.bond >= 70 and counts["record"] >= 2:
        return "기억을 쌓으며 관계가 단단해지고 있어."
    if last_action == "study" and pet.hp <= 45:
        return "조금 지쳤지만, 멈추지 않으려는 의지가 보여."
    return "오늘의 움직임이 조금씩 너와 나를 바꾸고 있어."


def build_memory_text(action: Literal["pray", "study", "record"], pet, counts: dict[str, int]) -> str:
    today = interpret_today(counts)
    mood = interpret_state_combo(pet, counts, action)

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
        return f"{base} {today}"
    return f"{base} {mood}"


def build_daily_report(pet, counts: dict[str, int]) -> list[str]:
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


def build_interaction_snapshot(
    pet,
    activity: dict,
    memories: list[dict],
    message: str | None = None,
):
    # TODO: replace template-based interpretation with external interaction engine (OpenClaw/LLM)
    counts = activity["today"]
    last_action = activity.get("last_action")

    memory_highlight = message or (memories[0]["text"] if memories else "오늘의 기억이 아직 없어.")

    return {
        "mood_summary": interpret_state_combo(pet, counts, last_action["action"] if last_action else None),
        "today_interpretation": interpret_today(counts),
        "memory_highlight": memory_highlight,
        "daily_report": build_daily_report(pet, counts),
    }
