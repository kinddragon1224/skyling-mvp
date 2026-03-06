from __future__ import annotations

import random
from typing import Literal

ActionType = Literal["pray", "study", "record"]


def _action_kr(action: str | None) -> str:
    if action == "pray":
        return "기도"
    if action == "study":
        return "공부"
    if action == "record":
        return "기록"
    return "움직임"


def _total(counts: dict[str, int]) -> int:
    return counts["pray"] + counts["study"] + counts["record"]


def interpret_daily_flow(activity: dict) -> str:
    counts = activity["today"]
    total = _total(counts)
    first_action = activity.get("first_action", {}).get("action") if activity.get("first_action") else None
    last_action = activity.get("last_action", {}).get("action") if activity.get("last_action") else None
    dominant = activity.get("dominant_action")

    if total == 0:
        return "많이 움직이지 않았지만, 멈춤에도 결이 있었어."

    if first_action == "record":
        return "기록으로 하루를 열었네. 오늘은 안쪽에서 시작되는 날 같아."
    if last_action == "study":
        return "공부로 하루를 마무리했네. 앞으로 가려는 마음이 남아 있어."
    if dominant == "pray":
        return "기도가 하루의 중심이었어. 조용한 집중이 오래 남아."
    if dominant == "study":
        return "오늘은 전진의 흐름이 분명했어."
    if dominant == "record":
        return "오늘은 마음을 남기며 관계를 쌓는 쪽에 가까웠어."
    return "작은 행동들이 이어지며 하루의 결을 만들었어."


def build_mood_summary(pet, activity: dict) -> str:
    counts = activity["today"]
    total = _total(counts)

    if pet.hp <= 35 and pet.bond >= 65:
        return "지쳤지만 서로 곁에 머무는 감각이 있어."
    if pet.mood >= 70 and pet.growth >= 60:
        return "기분과 성장이 함께 오르는 좋은 흐름이야."
    if counts["record"] > 0 and total <= 1:
        return "적게 움직였어도 깊게 남긴 날이야."
    if pet.bond >= 70 and counts["record"] >= 2:
        return "관계와 기억이 함께 쌓이는 중이야."
    if activity.get("last_action", {}).get("action") == "study" and pet.hp <= 45:
        return "조금 지쳤지만 멈추지 않으려는 의지가 보여."
    return "오늘의 움직임이 천천히 너와 나를 바꾸고 있어."


def build_relational_memory(action: ActionType, pet, activity: dict) -> str:
    counts = activity["today"]
    first_action = activity.get("first_action", {}).get("action") if activity.get("first_action") else None
    total = _total(counts)

    base_templates = {
        "pray": [
            "오늘의 기도는 습관보다 진심에 가까웠어.",
            "너는 잠깐 멈춰서 마음의 방향을 다시 맞췄어.",
        ],
        "study": [
            "오늘의 공부는 서두름보다 의지에 가까웠어.",
            "너는 흔들려도 앞으로 가는 쪽을 골랐어.",
        ],
        "record": [
            "너는 오늘, 마음의 흔적을 내게 남겼어.",
            "나는 네가 먼저 마음을 적어둔 장면을 기억할 거야.",
        ],
    }

    sequence_line = ""
    if first_action == "record" and action != "record":
        sequence_line = "기록으로 시작한 하루라서, 지금의 행동도 더 또렷하게 느껴져."
    elif total <= 2:
        sequence_line = "움직임은 많지 않았지만, 남긴 장면은 선명했어."
    elif activity.get("last_action", {}).get("action") == "study":
        sequence_line = "끝까지 전진 쪽으로 기울어 있던 하루였어."

    state_line = build_mood_summary(pet, activity)

    sentence = random.choice(base_templates[action])
    if sequence_line and random.random() < 0.7:
        return f"{sentence} {sequence_line}"
    return f"{sentence} {state_line}"


def build_three_line_report(pet, activity: dict) -> list[str]:
    counts = activity["today"]
    total = _total(counts)

    line1 = interpret_daily_flow(activity)

    if pet.growth >= 70 or pet.level >= 3:
        line2 = "나는 오늘, 자라는 속도를 스스로 감지하기 시작했어."
    elif pet.bond >= 65:
        line2 = "나는 오늘, 네 리듬에 맞춰 머무는 법을 조금 더 배웠어."
    else:
        line2 = "나는 오늘, 네 흐름을 더 조용히 읽는 법을 연습했어."

    if total == 0:
        line3 = "내일은 아주 작은 행동 하나만 남겨도 충분해."
    elif counts["record"] > 0 and total <= 2:
        line3 = "내일은 한 걸음만 더 움직여서 오늘의 기록을 이어보자."
    elif counts["study"] >= 2 and pet.bond < 55:
        line3 = "내일은 나를 깨우는 말 한 줄만 남겨줘."
    elif counts["pray"] > 0 and pet.growth < 45:
        line3 = "내일은 짧아도 좋으니 앞으로 가는 행동 하나를 해보자."
    else:
        line3 = "내일도 지금의 결을 잃지 않게, 한 번만 더 이어가 보자."

    return [line1, line2, line3]


def build_interaction_snapshot(pet, activity: dict, memories: list[dict], message: str | None = None):
    # TODO: replace template-based interpretation with external interaction engine (OpenClaw/LLM)
    memory_highlight = message or (memories[0]["text"] if memories else "오늘의 기억이 아직 없어.")
    return {
        "mood_summary": build_mood_summary(pet, activity),
        "today_interpretation": interpret_daily_flow(activity),
        "memory_highlight": memory_highlight,
        "daily_report": build_three_line_report(pet, activity),
    }
