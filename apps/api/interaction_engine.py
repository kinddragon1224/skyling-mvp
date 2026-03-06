from __future__ import annotations

import random
from typing import Literal

ActionType = Literal["pray", "study", "record"]


def _total(counts: dict[str, int]) -> int:
    return counts["pray"] + counts["study"] + counts["record"]


def _action_kr(action: str | None) -> str:
    if action == "pray":
        return "기도"
    if action == "study":
        return "공부"
    if action == "record":
        return "기록"
    return "움직임"


def classify_flow(activity: dict) -> str:
    counts = activity["today"]
    total = _total(counts)
    if total <= 1:
        return "잔잔형"

    values = [counts["pray"], counts["study"], counts["record"]]
    if min(values) >= 1 and (max(values) - min(values) <= 1):
        return "균형형"

    dominant = activity.get("dominant_action")
    if dominant == "study":
        return "전진형"
    if dominant == "record":
        return "성찰형"
    if dominant == "pray":
        return "회복형"
    return "혼합형"


def interpret_daily_flow(activity: dict) -> str:
    counts = activity["today"]
    total = _total(counts)
    first_action = activity.get("first_action", {}).get("action") if activity.get("first_action") else None
    last_action = activity.get("last_action", {}).get("action") if activity.get("last_action") else None
    dominant = activity.get("dominant_action")
    flow = activity.get("flow_type") or classify_flow(activity)

    if total == 0:
        return "많이 움직이지 않았지만, 멈춤에도 결이 있었어."
    if flow == "균형형":
        return "회복·전진·기억이 고르게 이어진 균형 있는 하루였어."
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

    if pet.hp <= 20 and pet.mood >= 70:
        return "몸은 지쳤지만 마음은 아직 밝아."
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


def build_short_reaction(activity: dict, mood_summary: str) -> str:
    total = activity.get("total_actions") or _total(activity["today"])
    last_action = activity.get("last_action", {}).get("action") if activity.get("last_action") else None
    flow = activity.get("flow_type") or classify_flow(activity)

    if total == 0:
        return "오늘은 멈춤의 결이 있어."
    if flow == "균형형":
        return "오늘은 리듬이 좋아."
    if last_action == "pray":
        return "마음이 조금 맑아졌어."
    if last_action == "study":
        return "한 걸음 앞으로 간 느낌이야."
    if last_action == "record":
        return "오늘을 잊지 않을게."

    short_map = {
        "지쳤지만 서로 곁에 머무는 감각이 있어.": "지쳐도 곁에 있어.",
        "기분과 성장이 함께 오르는 좋은 흐름이야.": "지금 흐름이 좋아.",
        "적게 움직였어도 깊게 남긴 날이야.": "적게 움직여도 깊었어.",
        "관계와 기억이 함께 쌓이는 중이야.": "관계가 쌓이고 있어.",
    }
    return short_map.get(mood_summary, "오늘의 결이 남아 있어.")


def build_relational_memory(action: ActionType, pet, activity: dict, context: dict | None = None) -> str:
    counts = activity["today"]
    first_action = activity.get("first_action", {}).get("action") if activity.get("first_action") else None
    total = _total(counts)
    context = context or {}

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

    synergy_lines = {
        "pray->study": "마음을 다잡고 전진으로 이어진 흐름이었어.",
        "study->record": "전진이 그냥 지나가지 않고 기억으로 남았어.",
        "pray->record": "안쪽을 돌본 뒤 관계를 더 깊게 남겼어.",
    }

    sequence_line = ""
    if context.get("synergy") in synergy_lines:
        sequence_line = synergy_lines[context["synergy"]]
    elif first_action == "record" and action != "record":
        sequence_line = "기록으로 시작한 하루라서, 지금의 행동도 더 또렷하게 느껴져."
    elif total <= 2:
        sequence_line = "움직임은 많지 않았지만, 남긴 장면은 선명했어."
    elif activity.get("last_action", {}).get("action") == "study":
        sequence_line = "끝까지 전진 쪽으로 기울어 있던 하루였어."

    if context.get("repeat_penalty", 0) > 0:
        sequence_line = "같은 리듬이 반복돼서 결이 조금 옅어졌어."

    state_line = build_mood_summary(pet, activity)

    sentence = random.choice(base_templates[action])
    if sequence_line and random.random() < 0.8:
        return f"{sentence} {sequence_line}"
    return f"{sentence} {state_line}"


def build_three_line_report(pet, activity: dict) -> list[str]:
    counts = activity["today"]
    total = _total(counts)
    flow = activity.get("flow_type") or classify_flow(activity)

    line1 = interpret_daily_flow(activity)

    if flow == "균형형":
        line2 = "나는 오늘, 회복과 전진과 기억을 함께 배우는 중이었어."
    elif pet.growth >= 70 or pet.level >= 3:
        line2 = "나는 오늘, 자라는 속도를 스스로 감지하기 시작했어."
    elif pet.bond >= 65:
        line2 = "나는 오늘, 네 리듬에 맞춰 머무는 법을 조금 더 배웠어."
    else:
        line2 = "나는 오늘, 네 흐름을 더 조용히 읽는 법을 연습했어."

    if total == 0:
        line3 = "내일은 아주 작은 행동 하나만 남겨도 충분해."
    elif counts["study"] >= 2 and counts["pray"] == 0:
        line3 = "내일은 짧은 기도로 체력을 채우고 다시 전진해보자."
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
    activity = {**activity, "flow_type": activity.get("flow_type") or classify_flow(activity)}
    mood_summary = build_mood_summary(pet, activity)
    today_interpretation = interpret_daily_flow(activity)
    full_report = build_three_line_report(pet, activity)
    memory_highlight = message or (memories[0]["text"] if memories else "오늘의 기억이 아직 없어.")

    return {
        "flow_type": activity["flow_type"],
        "short_reaction": build_short_reaction(activity, mood_summary),
        "room_bubble": build_short_reaction(activity, mood_summary),
        "interpretation_summary": today_interpretation.split(".")[0] + ("." if "." in today_interpretation else ""),
        "mood_summary": mood_summary,
        "today_interpretation": today_interpretation,
        "memory_highlight": memory_highlight,
        "daily_report": full_report,
        "full_report": full_report,
        "sequence": {
            "first_action": _action_kr(activity.get("first_action", {}).get("action") if activity.get("first_action") else None),
            "last_action": _action_kr(activity.get("last_action", {}).get("action") if activity.get("last_action") else None),
            "dominant_action": _action_kr(activity.get("dominant_action")),
        },
    }
