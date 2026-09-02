#!/usr/bin/env python3
"""Migrate v1 12-ray graph into V2 canonical bilingual knowledge JSON."""

from __future__ import annotations

import json
import re
from collections import defaultdict
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from en_content import EN

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src/data/Hubbard_Knowledge_Graph.json"
OUT = ROOT / "src/data/knowledge.v2.json"
REPORT = ROOT / "MIGRATION_REPORT_V2.md"

# old_id -> (new_id, primary_domain or view, action)
# action: move | merge | view | keep
MAP: dict[str, tuple[str, str, str]] = {
    "F01": ("survive-dynamic-principle", "D02", "move"),
    "F02": ("eight-dynamics", "D02", "move"),
    "F03": ("optimum-solution", "D02", "move"),
    "F04": ("theta-mest", "D01", "move"),
    "F05": ("cycle-of-action", "D01", "move"),
    "F06": ("be-do-have", "D01", "move"),
    "F07": ("life-as-game", "D01", "move"),
    "F08": ("communication-formula-cause-distance-effect", "D05", "move"),
    "E01": ("ethics-and-justice", "D03", "move"),
    "E02": ("responsibility", "D03", "move"),
    "E03": ("overt-act", "D03", "move"),
    "E04": ("withhold", "D03", "move"),
    "E05": ("motivator", "D03", "move"),
    "E06": ("justification", "D03", "move"),
    "E07": ("personal-integrity", "D03", "merge"),
    "E08": ("ethics-conditions", "D03", "move"),
    "E09": ("social-and-antisocial-personality", "D03", "move"),
    "E10": ("suppression", "D03", "move"),
    "E11": ("pts-sp", "D03", "move"),
    "E12": ("third-party-law", "D03", "move"),
    "M01": ("analytical-mind", "D04", "move"),
    "M02": ("reactive-mind", "D04", "move"),
    "M03": ("somatic-mind", "D04", "move"),
    "M04": ("engram", "D04", "move"),
    "M05": ("secondary", "D04", "move"),
    "M06": ("lock", "D04", "move"),
    "M07": ("chain", "D04", "move"),
    "M08": ("restimulation", "D04", "move"),
    "M09": ("charge", "D04", "merge"),
    "M10": ("mental-image-picture", "D04", "move"),
    "M11": ("clear", "D07", "move"),
    "T01": ("tone-scale", "D05", "move"),
    "T02": ("chart-of-human-evaluation", "D05", "move"),
    "T03": ("arc-tone-scales", "D05", "move"),
    "T04": ("theta-entheta", "D05", "move"),
    "T05": ("sub-zero-tone-scale", "D05", "move"),
    "C01": ("arc-triangle", "D05", "move"),
    "C02": ("communication-formula", "D05", "move"),
    "C03": ("communication-cycle", "D05", "move"),
    "C04": ("duplication", "D05", "move"),
    "C05": ("reality", "D05", "move"),
    "C06": ("affinity", "D05", "move"),
    "C07": ("confront", "D05", "move"),
    "C08": ("training-routines", "D05", "move"),
    "C09": ("communication-lag", "D05", "move"),
    "C10": ("control-start-change-stop", "D01", "move"),
    "L01": ("absence-of-mass", "D06", "move"),
    "L02": ("too-steep-gradient", "D06", "move"),
    "L03": ("misunderstood-word", "D06", "move"),
    "L04": ("word-clearing", "D06", "move"),
    "L05": ("demonstration-and-mass", "D06", "move"),
    "L06": ("gradient", "D06", "move"),
    "P01": ("auditor", "D07", "move"),
    "P02": ("preclear", "D07", "move"),
    "P03": ("e-meter", "D07", "move"),
    "P04": ("charge", "D04", "merge"),
    "P05": ("auditors-code", "D07", "move"),
    "P06": ("objective-communication-processes", "D07", "move"),
    "P07": ("straightwire", "D07", "move"),
    "P08": ("grade-chart-bridge", "D07", "move"),
    "P09": ("rundown", "D07", "move"),
    "S01": ("thetan", "D01", "move"),
    "S02": ("mind-body-thetan", "D01", "move"),
    "S03": ("life-static", "D01", "move"),
    "S04": ("exteriorization", "D01", "move"),
    "S05": ("whole-track", "D01", "move"),
    "S06": ("operating-thetan", "D07", "move"),
    "S07": ("own-universe-mest-universe", "D01", "move"),
    "S08": ("postulate-consideration", "D01", "move"),
    "A01": ("third-dynamic-technology", "D08", "move"),
    "A02": ("statistic", "D08", "move"),
    "A03": ("admin-conditions", "D08", "move"),
    "A04": ("management-by-statistics", "D08", "move"),
    "A05": ("org-board", "D08", "move"),
    "A06": ("cycle-of-production", "D08", "move"),
    "A07": ("valuable-final-product", "D08", "move"),
    "A08": ("hat", "D08", "move"),
    "A09": ("targets-programs-projects-orders", "D08", "move"),
    "A10": ("data-series", "D08", "move"),
    "A11": ("admin-scale", "D08", "move"),
    "A12": ("policy", "D08", "move"),
    "A13": ("exchange", "D08", "move"),
    "R01": ("confusion-and-stable-datum", "D01", "move"),
    "R02": ("problem", "D01", "move"),
    "R03": ("personal-integrity", "D03", "merge"),
    "R04": ("marriage-family", "D02", "view"),
    "R05": ("children", "D02", "view"),
    "R06": ("greatness", "D03", "move"),
    "K01": ("dianetic-axioms", "V03", "view"),
    "K02": ("scientology-axioms", "V03", "view"),
    "K03": ("logics", "V03", "view"),
    "K04": ("codes", "V03", "view"),
    "K05": ("definitions", "V03", "view"),
    "H01": ("era-pre-1950", "V02", "view"),
    "H02": ("era-1950-dianetics", "V02", "view"),
    "H03": ("era-1950-1951-arc-tone", "V02", "view"),
    "H04": ("era-1951-self-determinism", "V02", "view"),
    "H05": ("era-1952-1953-thetan", "V02", "view"),
    "H06": ("era-1954-axioms-exteriorization", "V02", "view"),
    "H07": ("era-1955-1959-communication", "V02", "view"),
    "H08": ("era-1960s-ethics-org", "V02", "view"),
    "H09": ("era-later-corpus", "V02", "view"),
}

TITLES: dict[str, tuple[str, str, str]] = {
    # new_id: (en, ru, originalTerm)
    "survive-dynamic-principle": ("Dynamic Principle of Existence: Survive!", "Динамический принцип существования: «Выживай!»", "Survive!"),
    "eight-dynamics": ("Eight Dynamics", "Восемь динамик", "Eight Dynamics"),
    "optimum-solution": ("Optimum Solution / Greatest Good", "Оптимальное решение / наибольшее благо", "Optimum Solution"),
    "theta-mest": ("Theta / MEST", "Theta / MEST: жизнь и физическая вселенная", "Theta / MEST"),
    "cycle-of-action": ("Cycle of Action", "Цикл действия: создавать — сохранять — разрушать", "Cycle of Action"),
    "be-do-have": ("Be / Do / Have", "Условия существования: Be / Do / Have", "Be / Do / Have"),
    "life-as-game": ("Life as a Game", "Жизнь как игра", "Games"),
    "communication-formula-cause-distance-effect": ("Cause — Distance — Effect", "Причина — дистанция — следствие", "Cause-Distance-Effect"),
    "ethics-and-justice": ("Ethics and Justice", "Этика и справедливость", "Ethics / Justice"),
    "responsibility": ("Responsibility", "Ответственность", "Responsibility"),
    "overt-act": ("Overt Act", "Оверт (Overt Act)", "Overt Act"),
    "withhold": ("Withhold", "Висхолд (Withhold)", "Withhold"),
    "motivator": ("Motivator", "Мотиватор", "Motivator"),
    "justification": ("Justification", "Оправдание (Justification)", "Justification"),
    "personal-integrity": ("Personal Integrity", "Личная целостность (Personal Integrity)", "Personal Integrity"),
    "ethics-conditions": ("Ethics Conditions", "Состояния существования и формулы", "Conditions"),
    "social-and-antisocial-personality": ("Social and Antisocial Personality", "Социальная и антисоциальная личность", "Social / Antisocial Personality"),
    "suppression": ("Suppression", "Подавление (Suppression)", "Suppression"),
    "pts-sp": ("PTS / SP", "PTS / SP", "PTS / SP"),
    "third-party-law": ("Third Party Law", "Закон третьей стороны", "Third Party Law"),
    "analytical-mind": ("Analytical Mind", "Аналитический ум", "Analytical Mind"),
    "reactive-mind": ("Reactive Mind", "Реактивный ум", "Reactive Mind"),
    "somatic-mind": ("Somatic Mind", "Соматический ум", "Somatic Mind"),
    "engram": ("Engram", "Инграмма (Engram)", "Engram"),
    "secondary": ("Secondary", "Secondary — вторичный инцидент", "Secondary"),
    "lock": ("Lock", "Lock — лок", "Lock"),
    "chain": ("Chain", "Цепь инцидентов", "Chain"),
    "restimulation": ("Restimulation / Key-In", "Рестимуляция / key-in", "Restimulation"),
    "charge": ("Charge", "Заряд (Charge)", "Charge"),
    "mental-image-picture": ("Mental Image Picture / Facsimile", "Ментальная картинка / факсимиле", "Mental Image Picture"),
    "clear": ("Clear", "Клир (Clear)", "Clear"),
    "tone-scale": ("Tone Scale", "Шкала тонов", "Tone Scale"),
    "chart-of-human-evaluation": ("Hubbard Chart of Human Evaluation", "Таблица оценки человека", "Chart of Human Evaluation"),
    "arc-tone-scales": ("ARC Tone Scales", "Шкалы АРО", "ARC Tone Scales"),
    "theta-entheta": ("Theta / Entheta", "Theta / entheta", "Theta / Entheta"),
    "sub-zero-tone-scale": ("Sub-Zero Tone Scale", "Поднулевая шкала тонов", "Sub-Zero Tone Scale"),
    "arc-triangle": ("ARC Triangle", "Треугольник АРО (ARC Triangle)", "ARC Triangle"),
    "communication-formula": ("Communication Formula", "Формула коммуникации", "Communication Formula"),
    "communication-cycle": ("Communication Cycle", "Цикл коммуникации и acknowledgement", "Communication Cycle"),
    "duplication": ("Duplication", "Duplication — воспроизведение", "Duplication"),
    "reality": ("Reality", "Реальность как agreement", "Reality"),
    "affinity": ("Affinity", "Аффинити (Affinity)", "Affinity"),
    "confront": ("Confront", "Конфронт (Confront)", "Confront"),
    "training-routines": ("TRs — Training Routines", "TRs — тренировочные упражнения", "TRs"),
    "communication-lag": ("Communication Lag", "Задержка коммуникации", "Communication Lag"),
    "control-start-change-stop": ("Control: Start — Change — Stop", "Контроль: start — change — stop", "Start-Change-Stop"),
    "absence-of-mass": ("Absence of Mass", "Отсутствие массы", "Absence of Mass"),
    "too-steep-gradient": ("Too Steep a Gradient", "Слишком крутой градиент", "Too Steep a Gradient"),
    "misunderstood-word": ("Misunderstood Word", "Непонятое или неверно понятое слово", "Misunderstood Word"),
    "word-clearing": ("Word Clearing", "Прояснение слов (Word Clearing)", "Word Clearing"),
    "demonstration-and-mass": ("Demonstration and Mass", "Демонстрация и масса", "Mass"),
    "gradient": ("Gradient", "Градиентное обучение", "Gradient"),
    "auditor": ("Auditor", "Одитор (Auditor)", "Auditor"),
    "preclear": ("Preclear", "Преклир (Preclear)", "Preclear"),
    "e-meter": ("E-Meter", "Е-метр (E-Meter)", "E-Meter"),
    "auditors-code": ("Auditor's Code", "Кодекс одитора", "Auditor's Code"),
    "objective-communication-processes": ("Objective / Communication Processes", "Объективные и коммуникационные процессы", "Objective Processes"),
    "straightwire": ("Straightwire / Recall", "Straightwire и процессы вспоминания", "Straightwire"),
    "grade-chart-bridge": ("Grade Chart / The Bridge", "Таблица ступеней / Мост", "The Bridge"),
    "rundown": ("Rundown", "Рандаун (Rundown)", "Rundown"),
    "thetan": ("Thetan", "Тэтан (Thetan)", "Thetan"),
    "mind-body-thetan": ("Mind — Body — Thetan", "Ум, тело, тэтан", "Mind-Body-Thetan"),
    "life-static": ("Life Static", "Жизненная статика", "Life Static"),
    "exteriorization": ("Exteriorization", "Экстериоризация (Exteriorization)", "Exteriorization"),
    "whole-track": ("Whole Track / Past Lives", "Полный трак / прошлые жизни", "Whole Track"),
    "operating-thetan": ("Operating Thetan (OT)", "Оперирующий тэтан (OT)", "Operating Thetan"),
    "own-universe-mest-universe": ("Own Universe / MEST Universe", "Собственная вселенная / MEST-вселенная", "Own Universe"),
    "postulate-consideration": ("Postulate / Consideration", "Постулат / рассмотрение", "Postulate"),
    "third-dynamic-technology": ("Third Dynamic Technology", "Технология третьей динамики", "Third Dynamic Technology"),
    "statistic": ("Statistic", "Статистика", "Statistic"),
    "admin-conditions": ("Conditions (Admin)", "Состояния (админ)", "Conditions"),
    "management-by-statistics": ("Management by Statistics", "Управление по статистикам", "Management by Statistics"),
    "org-board": ("Organizing Board", "Оргборд (Org Board)", "Org Board"),
    "cycle-of-production": ("Cycle of Production", "Цикл производства", "Cycle of Production"),
    "valuable-final-product": ("Valuable Final Product (VFP)", "Ценный конечный продукт (VFP)", "VFP"),
    "hat": ("Hat / Hatting", "Шляпа / хаттинг", "Hat"),
    "targets-programs-projects-orders": ("Targets, Programs, Projects, Orders", "Цели, программы, проекты, приказы", "Targets"),
    "data-series": ("Data Series", "Серия данных", "Data Series"),
    "admin-scale": ("Admin Scale", "Административная шкала", "Admin Scale"),
    "policy": ("Policy", "Политика", "Policy"),
    "exchange": ("Exchange", "Обмен (Exchange)", "Exchange"),
    "confusion-and-stable-datum": ("Confusion and Stable Datum", "Замешательство и стабильное данное", "Stable Datum"),
    "problem": ("Problem", "Проблема", "Problem"),
    "marriage-family": ("Marriage / Family", "Брак и семья", "Marriage"),
    "children": ("Children", "Дети", "Children"),
    "greatness": ("Greatness", "Величие", "Greatness"),
    "dianetic-axioms": ("Dianetic Axioms", "Аксиомы Дианетики", "Dianetic Axioms"),
    "scientology-axioms": ("Scientology Axioms", "Аксиомы Саентологии", "Scientology Axioms"),
    "logics": ("Logics", "Логики", "Logics"),
    "codes": ("Codes", "Кодексы", "Codes"),
    "definitions": ("Definitions", "Определения как часть технологии", "Definitions"),
    "era-pre-1950": ("Pre-1950", "До 1950: предыстория Дианетики", "Pre-1950"),
    "era-1950-dianetics": ("1950: Book One — Dianetics", "1950: Book One — Дианетика", "1950"),
    "era-1950-1951-arc-tone": ("1950–1951: ARC, Emotion, Human Evaluation", "1950–1951: АРО, эмоция и оценка человека", "1950–1951"),
    "era-1951-self-determinism": ("1951: Self-Determinism and Axioms", "1951: self-determinism и аксиомы", "1951"),
    "era-1952-1953-thetan": ("1952–1953: Spiritual Turn", "1952–1953: духовный поворот", "1952–1953"),
    "era-1954-axioms-exteriorization": ("1954: Scientology Axioms and Exteriorization", "1954: аксиомы Саентологии и экстериоризация", "1954"),
    "era-1955-1959-communication": ("1955–1959: Communication as Central Mechanism", "1955–1959: коммуникация как центральный механизм", "1955–1959"),
    "era-1960s-ethics-org": ("1960s: Responsibility, Overts, Ethics, Organization", "1960-е: ответственность, оверты/висхолды, этика и организация", "1960s"),
    "era-later-corpus": ("Later Corpus: Study Tech, Admin Tech, Bridge", "Поздний корпус: Study Tech, Admin Tech, Bridge", "Later corpus"),
}

DOMAINS = [
    ("D01", "Foundations & Ontology", "Фундамент и онтология", "What is existence, life, a being, a universe, causation, action and creation within the system?", "Что в системе такое существование, жизнь, существо, вселенная, причинность, действие и творение?"),
    ("D02", "Survival & Dynamics", "Выживание и динамики", "What does survival mean and through which areas is it evaluated?", "Что значит выживание и по каким сферам оно оценивается?"),
    ("D03", "Ethics & Social Environment", "Этика и социальная среда", "How does the system connect behavior, responsibility, harm and survival?", "Как система связывает поведение, ответственность, вред и выживание?"),
    ("D04", "Mind & Dianetics", "Разум и Дианетика", "How does Dianetics model memory, irrational reaction and painful incidents?", "Как Дианетика моделирует память, иррациональную реакцию и болезненные инциденты?"),
    ("D05", "Emotion, ARC & Communication", "Эмоция, АРО и коммуникация", "How does the system model emotional tone, understanding and communication?", "Как система моделирует эмоциональный тон, понимание и коммуникацию?"),
    ("D06", "Knowledge & Study", "Знание и обучение", "How does the system approach learning, definitions and study barriers?", "Как система подходит к обучению, определениям и барьерам изучения?"),
    ("D07", "Auditing & Bridge", "Одитинг и Мост", "How are auditing, processing, training progression, Clear and the Bridge related?", "Как связаны одитинг, процессинг, обучение, Clear и Мост?"),
    ("D08", "Groups, Organization & Management", "Группы, организация и управление", "How does the system model groups, production, statistics and management?", "Как система моделирует группы, производство, статистики и управление?"),
]

STATUS_KEY = [
    (r"не науч|не медицин|не клинич|не валид|не установлен|проверять по|не установлен современной", "historical_dianetics_model"),
    (r"религ|доктрин|метафиз|духовн", "religious_doctrinal_claim"),
    (r"Административ|организационн", "organizational_framework"),
    (r"Формальн|исходные положения|Методолог", "formal_system_statement"),
    (r"Термин|Практика|Внутренний|инструмент|кодекс|маршрут", "internal_technical_term"),
    (r"Модель|эвристика|гипотеза|типология|конструкт|концепт|Раздел карты", "internal_model"),
]

STATUS_LABEL = {
    "internal_model": ("Model within Hubbard's system", "Модель внутри системы Хаббарда"),
    "historical_dianetics_model": ("Historical Dianetics model; not scientific consensus", "Историческая модель Дианетики; не научный консенсус"),
    "religious_doctrinal_claim": ("Religious / doctrinal claim", "Религиозно-доктринальное утверждение"),
    "internal_technical_term": ("Internal technical term", "Внутренний технический термин"),
    "organizational_framework": ("Organizational framework within Hubbard's system", "Организационная модель внутри системы Хаббарда"),
    "formal_system_statement": ("Formal proposition within the system", "Формальное положение системы"),
}

TYPE_OF = {
    "view": None,
}


def status_key(raw: str | None) -> str:
    if not raw:
        return "internal_model"
    for pat, key in STATUS_KEY:
        if re.search(pat, raw, re.I):
            return key
    return "internal_model"


def loc(en: str, ru: str) -> dict:
    return {"en": en, "ru": ru}


def en_from_ru(text: str) -> str:
    """Sense-level English for existing Russian study notes. Not a literal calque."""
    return text  # filled below per-node from existing bilingual fields + short map


def main() -> None:
    old = json.loads(SRC.read_text(encoding="utf-8"))
    old_nodes = {n["id"]: n for n in old["nodes"]}
    children = defaultdict(list)
    related = defaultdict(list)
    for e in old["edges"]:
        if e["type"] == "contains":
            children[e["source"]].append(e["target"])
        else:
            related[e["source"]].append(e["target"])
            related[e["target"]].append(e["source"])

    concepts: dict[str, dict] = {}
    report_rows = []
    legacy_to_new = {"ROOT": "hubbard-knowledge-map"}
    for oid, (nid, domain, action) in MAP.items():
        legacy_to_new[oid] = nid

    def gist(n: dict) -> tuple[str | None, str | None]:
        short = n.get("short") if isinstance(n.get("short"), str) else None
        expl = n.get("explanation") if isinstance(n.get("explanation"), str) else None
        example = n.get("example") if isinstance(n.get("example"), str) else None
        refs = list(n.get("refs") or [])
        if isinstance(n.get("example"), list):
            for k in n["example"]:
                if k not in refs:
                    refs.append(k)
            example = None
        return short, expl, example, refs

    # merge buckets
    buckets: dict[str, list[str]] = defaultdict(list)
    for oid, (nid, domain, action) in MAP.items():
        buckets[nid].append(oid)

    for nid, old_ids in buckets.items():
        prim_old = old_ids[0]
        # prefer concept record over later merge donor for body
        if nid == "charge":
            prim_old = "M09"
        if nid == "personal-integrity":
            prim_old = "E07"
        src = old_nodes[prim_old]
        short, expl, example, refs = gist(src)
        for oid in old_ids[1:]:
            extra = old_nodes[oid]
            s2, e2, x2, r2 = gist(extra)
            for k in r2:
                if k not in refs:
                    refs.append(k)
        en_t, ru_t, orig = TITLES[nid]
        _, domain, action = MAP[prim_old]
        node_type = "concept"
        if nid.startswith("era-"):
            node_type = "timeline_era"
        elif nid in {"dianetic-axioms", "scientology-axioms", "logics", "codes", "definitions"}:
            node_type = "formal_framework"
        elif nid in {"marriage-family", "children"}:
            node_type = "application_topic"
        key = status_key(src.get("status"))
        en_label, ru_label = STATUS_LABEL[key]
        concepts[nid] = {
            "id": nid,
            "legacyIds": old_ids,
            "type": node_type,
            "primaryDomainId": domain if domain.startswith("D") else None,
            "parentId": domain if domain.startswith("D") else None,
            "title": loc(en_t, ru_t),
            "shortDefinition": loc(short or en_t, short or ru_t) if short else loc(en_t, ru_t),
            # EN short: use English title as fallback if we only have RU short
            "coreIdea": loc(expl or "", expl or "") if expl else None,
            "explanation": loc(expl or "", expl or "") if expl else None,
            "simpleExample": loc(example or "", example or "") if example else None,
            "epistemicStatus": {"key": key, "label": loc(en_label, src.get("status") or ru_label)},
            "sourceIds": refs,
            "aliases": {"en": [orig], "ru": [ru_t]},
            "metadata": {
                "originalTerm": orig,
                "firstKnownPeriod": None,
                "translationStatus": {"en": "draft", "ru": "verified"},
            },
            "relatedDomains": [],
        }
        # If short is Russian, put it in ru and a concise EN from title
        en_pack = EN.get(nid, {})
        if short or en_pack.get("short"):
            concepts[nid]["shortDefinition"] = {
                "en": en_pack.get("short") or en_t,
                "ru": short or ru_t,
            }
        if expl or en_pack.get("expl"):
            concepts[nid]["coreIdea"] = {"en": en_pack.get("expl") or "", "ru": expl or ""}
            concepts[nid]["explanation"] = {"en": en_pack.get("expl") or "", "ru": expl or ""}
            concepts[nid]["metadata"]["translationStatus"]["en"] = "verified" if en_pack.get("expl") else "draft"
        if example or en_pack.get("ex"):
            concepts[nid]["simpleExample"] = {
                "en": en_pack.get("ex") or "",
                "ru": example or "",
            }

    # Extra D01 concept required by spec
    concepts["cause-effect"] = {
        "id": "cause-effect",
        "legacyIds": [],
        "type": "concept",
        "primaryDomainId": "D01",
        "parentId": "D01",
        "title": loc("Cause / Effect", "Причина / следствие"),
        "shortDefinition": loc(
            "Abstract position of cause versus effect, distinct from the communication formula.",
            "Абстрактное положение причины и следствия, отдельно от формулы коммуникации.",
        ),
        "coreIdea": loc(
            "In the ontology, a being may occupy cause or effect. The communication formula uses the same words as a geometry of a message: cause, distance, effect.",
            "В онтологии существо может быть в позиции причины или следствия. Формула коммуникации использует те же слова как геометрию сообщения.",
        ),
        "epistemicStatus": {"key": "internal_model", "label": loc(*STATUS_LABEL["internal_model"])},
        "sourceIds": ["fundamentals", "creation"],
        "aliases": {"en": ["Cause", "Effect"], "ru": ["Причина", "Следствие"]},
        "metadata": {"originalTerm": "Cause / Effect", "translationStatus": {"en": "verified", "ru": "verified"}},
        "relatedDomains": ["D05"],
    }

    # relatedDomains for specials
    concepts["charge"]["relatedDomains"] = ["D07"]
    concepts["clear"]["relatedDomains"] = ["D04"]
    concepts["operating-thetan"]["relatedDomains"] = ["D01"]
    concepts["exteriorization"]["relatedDomains"] = ["D07"]
    concepts["optimum-solution"]["relatedDomains"] = ["D03"]
    concepts["personal-integrity"]["applicationContextIds"] = ["application-ethics", "application-self"]
    concepts["confusion-and-stable-datum"]["applicationContextIds"] = ["application-work", "application-decision"]
    concepts["problem"]["applicationContextIds"] = ["application-decision", "application-conflict"]
    concepts["greatness"]["applicationContextIds"] = ["application-ethics", "application-self"]

    formal_extras = [
        (
            "the-factors",
            "The Factors",
            "Факторы",
            "A formal sequence of cosmological propositions in Hubbard's later system. The wording is not reproduced here.",
            "Формальная последовательность космологических положений поздней системы Хаббарда. Формулировки здесь не воспроизводятся.",
        ),
        (
            "scales",
            "Scales",
            "Шкалы",
            "A family of formal scales used as orientation devices inside the system, including tone and related charts.",
            "Семейство формальных шкал как ориентиров внутри системы, включая шкалу тонов и связанные таблицы.",
        ),
        (
            "awareness-levels",
            "Awareness Levels",
            "Уровни осознания",
            "A formal awareness chart used in later training and processing orientation. Detailed steps are not reproduced here.",
            "Формальная таблица уровней осознания в поздней ориентации обучения и процессинга. Подробные ступени здесь не воспроизводятся.",
        ),
        (
            "perceptics",
            "Perceptics",
            "Перцептики",
            "A catalog of perception channels used in some technical materials. The list is not reproduced as a substitute for the source.",
            "Каталог каналов восприятия в части технических материалов. Список не воспроизводится вместо первоисточника.",
        ),
    ]
    for fid, en, ru, sen, sru in formal_extras:
        concepts[fid] = {
            "id": fid,
            "legacyIds": [],
            "type": "formal_framework",
            "primaryDomainId": None,
            "parentId": None,
            "title": loc(en, ru),
            "shortDefinition": loc(sen, sru),
            "coreIdea": loc(sen, sru),
            "epistemicStatus": {"key": "formal_system_statement", "label": loc(*STATUS_LABEL["formal_system_statement"])},
            "sourceIds": ["bibliography"],
            "aliases": {"en": [en], "ru": [ru]},
            "metadata": {"originalTerm": en, "translationStatus": {"en": "verified", "ru": "verified"}},
            "relatedDomains": ["D01"],
        }

    domains = []
    for did, en, ru, qen, qru in DOMAINS:
        domains.append({
            "id": did,
            "legacyIds": [],
            "type": "domain",
            "primaryDomainId": did,
            "parentId": "hubbard-knowledge-map",
            "title": loc(en, ru),
            "shortDefinition": loc(qen, qru),
            "epistemicStatus": {"key": "internal_model", "label": loc("Map domain", "Раздел карты")},
            "sourceIds": [],
            "metadata": {"originalTerm": en, "translationStatus": {"en": "verified", "ru": "verified"}},
        })

    root = {
        "id": "hubbard-knowledge-map",
        "legacyIds": ["ROOT"],
        "type": "domain",
        "primaryDomainId": None,
        "parentId": None,
        "title": loc("Hubbard Knowledge Map", "Карта знаний Хаббарда"),
        "shortDefinition": loc(
            "System of the works of L. Ron Hubbard — interactive knowledge architecture.",
            "Система работ Л. Рона Хаббарда — интерактивная архитектура знаний.",
        ),
        "epistemicStatus": {"key": "internal_model", "label": loc("Map root", "Корень карты")},
        "sourceIds": [],
        "metadata": {"originalTerm": "Hubbard Knowledge Map", "translationStatus": {"en": "verified", "ru": "verified"}},
    }

    application_topics = [
        ("application-self", "Self", "Себя"),
        ("application-relationships", "Relationships", "Отношения"),
        ("application-marriage", "Marriage / Family", "Брак / семья"),
        ("application-children", "Children", "Дети"),
        ("application-work", "Work", "Работа"),
        ("application-leadership", "Leadership", "Лидерство"),
        ("application-groups", "Groups", "Группы"),
        ("application-conflict", "Conflict", "Конфликт"),
        ("application-decision", "Decision Making", "Принятие решений"),
        ("application-study", "Study", "Обучение"),
        ("application-communication", "Communication", "Коммуникация"),
        ("application-ethics", "Ethics", "Этика"),
        ("application-production", "Production", "Производство"),
    ]
    app_nodes = []
    for aid, en, ru in application_topics:
        app_nodes.append({
            "id": aid,
            "legacyIds": [],
            "type": "application_topic",
            "title": loc(en, ru),
            "shortDefinition": loc(f"Application context: {en}.", f"Контекст применения: {ru}."),
            "linkedConceptIds": [],
            "metadata": {"translationStatus": {"en": "verified", "ru": "verified"}},
        })

    app_links = {
        "application-self": ["survive-dynamic-principle", "responsibility", "personal-integrity", "greatness", "be-do-have"],
        "application-relationships": ["arc-triangle", "affinity", "communication-formula", "third-party-law"],
        "application-marriage": ["marriage-family", "eight-dynamics", "arc-triangle"],
        "application-children": ["children", "eight-dynamics", "gradient"],
        "application-work": ["confusion-and-stable-datum", "problem", "cycle-of-production", "exchange"],
        "application-leadership": ["responsibility", "org-board", "hat", "policy"],
        "application-groups": ["third-dynamic-technology", "eight-dynamics", "suppression"],
        "application-conflict": ["third-party-law", "overt-act", "withhold", "problem"],
        "application-decision": ["optimum-solution", "eight-dynamics", "data-series"],
        "application-study": ["misunderstood-word", "word-clearing", "gradient", "absence-of-mass"],
        "application-communication": ["arc-triangle", "communication-cycle", "confront", "training-routines"],
        "application-ethics": ["ethics-and-justice", "responsibility", "overt-act", "personal-integrity"],
        "application-production": ["valuable-final-product", "statistic", "admin-conditions", "cycle-of-production"],
    }
    for node in app_nodes:
        node["linkedConceptIds"] = [x for x in app_links[node["id"]] if x in concepts]

    # sources
    sources = []
    for key, val in old["sources"].items():
        title = val["title"]
        # split EN — RU if present
        if " — " in title:
            en_s, ru_s = title.split(" — ", 1)
        else:
            en_s, ru_s = title, title
        linked = [nid for nid, c in concepts.items() if key in (c.get("sourceIds") or [])]
        sources.append({
            "id": key,
            "originalTitle": en_s.strip(),
            "title": {"en": en_s.strip(), "ru": ru_s.strip("«» ")},
            "author": "L. Ron Hubbard",
            "sourceType": "lecture" if "lecture" in en_s.lower() or "курс" in title.lower() or "Congress" in en_s else "book",
            "url": val.get("url"),
            "linkedConceptIds": linked,
            "verificationStatus": "partially_verified",
        })

    # relations
    relations = []
    rid = 0

    def add_rel(src, tgt, typ):
        nonlocal rid
        if src not in {root["id"], *[d["id"] for d in domains], *concepts} and src != "hubbard-knowledge-map":
            if src not in concepts:
                return
        if tgt not in concepts and tgt not in {d["id"] for d in domains} and tgt != "hubbard-knowledge-map":
            return
        rid += 1
        relations.append({
            "id": f"rel-{rid:04d}",
            "sourceId": src,
            "targetId": tgt,
            "type": typ,
        })

    for d in domains:
        add_rel("hubbard-knowledge-map", d["id"], "parent_of")
    for nid, c in concepts.items():
        parent = c.get("parentId")
        if parent:
            add_rel(parent, nid, "parent_of")
    seen_rel = set()
    for e in old["edges"]:
        if e["type"] != "related":
            continue
        a = legacy_to_new.get(e["source"])
        b = legacy_to_new.get(e["target"])
        if not a or not b or a == b:
            continue
        key = tuple(sorted((a, b)))
        if key in seen_rel:
            continue
        seen_rel.add(key)
        add_rel(a, b, "related_to")

    add_rel("survive-dynamic-principle", "eight-dynamics", "depends_on")
    add_rel("eight-dynamics", "optimum-solution", "depends_on")
    add_rel("optimum-solution", "ethics-and-justice", "depends_on")
    add_rel("cause-effect", "communication-formula-cause-distance-effect", "contrasts_with")
    add_rel("engram", "clear", "related_to")
    add_rel("reactive-mind", "clear", "related_to")
    add_rel("charge", "auditor", "related_to")
    add_rel("thetan", "operating-thetan", "related_to")
    add_rel("exteriorization", "operating-thetan", "related_to")

    # learning paths
    def existing(ids):
        return [i for i in ids if i in concepts]

    paths = [
        {
            "id": "foundations",
            "title": loc("Foundations", "Фундамент"),
            "subtitle": loc("Ontology and the geometry of action", "Онтология и геометрия действия"),
            "nodeIds": existing(["theta-mest", "thetan", "be-do-have", "cycle-of-action", "life-as-game", "cause-effect"]),
        },
        {
            "id": "survival-ethics",
            "title": loc("Survival & Ethics", "Выживание и этика"),
            "subtitle": loc("Survive → Dynamics → Optimum → Ethics → Overt → Withhold", "Выживай → динамики → оптимум → этика → оверт → висхолд"),
            "nodeIds": existing(["survive-dynamic-principle", "eight-dynamics", "optimum-solution", "ethics-and-justice", "responsibility", "overt-act", "withhold"]),
        },
        {
            "id": "mind-dianetics",
            "title": loc("Mind & Dianetics", "Разум и Дианетика"),
            "subtitle": loc("Incident to restimulation", "От инцидента к рестимуляции"),
            "nodeIds": existing(["analytical-mind", "reactive-mind", "mental-image-picture", "engram", "secondary", "lock", "chain", "charge", "restimulation"]),
        },
        {
            "id": "communication-arc",
            "title": loc("Communication & ARC", "Коммуникация и АРО"),
            "subtitle": loc("Understanding as affinity, reality, communication", "Понимание как аффинити, реальность, общение"),
            "nodeIds": existing(["arc-triangle", "affinity", "reality", "communication-formula", "communication-cycle", "confront", "tone-scale"]),
        },
        {
            "id": "study",
            "title": loc("Study", "Обучение"),
            "subtitle": loc("Three barriers and application of knowledge", "Три барьера и применение знания"),
            "nodeIds": existing(["absence-of-mass", "too-steep-gradient", "misunderstood-word", "word-clearing", "demonstration-and-mass", "gradient"]),
        },
        {
            "id": "auditing-bridge",
            "title": loc("Auditing & Bridge", "Одитинг и Мост"),
            "subtitle": loc("Session architecture to Clear and OT", "От архитектуры сессии к Clear и OT"),
            "nodeIds": existing(["auditor", "preclear", "auditors-code", "e-meter", "straightwire", "grade-chart-bridge", "clear", "operating-thetan"]),
        },
        {
            "id": "organization",
            "title": loc("Organization", "Организация"),
            "subtitle": loc("Third dynamic technology", "Технология третьей динамики"),
            "nodeIds": existing(["third-dynamic-technology", "org-board", "hat", "valuable-final-product", "statistic", "admin-conditions", "data-series"]),
        },
    ]

    timeline = []
    for oid, (nid, _, _) in MAP.items():
        if not nid.startswith("era-"):
            continue
        src = old_nodes[oid]
        linked = []
        for lid in src.get("links") or []:
            if lid in legacy_to_new:
                linked.append(legacy_to_new[lid])
        for rid in related[oid]:
            if rid in legacy_to_new and legacy_to_new[rid] not in linked:
                if not legacy_to_new[rid].startswith("era-"):
                    linked.append(legacy_to_new[rid])
        timeline.append({
            "id": nid,
            "legacyIds": [oid],
            "period": TITLES[nid][0],
            "title": loc(*TITLES[nid][:2]),
            "summary": loc(
                EN.get(nid, {}).get("expl") or EN.get(nid, {}).get("short") or TITLES[nid][0],
                src.get("short") or src.get("summary") or TITLES[nid][1],
            ),
            "linkedConceptIds": linked,
            "sourceIds": src.get("refs") or ([] if not isinstance(src.get("example"), list) else src["example"]),
        })

    nodes = [root, *domains, *concepts.values(), *app_nodes]

    data = {
        "meta": {
            "version": "2.0",
            "languages": ["en", "ru"],
            "defaultLanguage": "en",
            "migratedFrom": "Hubbard_Knowledge_Graph.json",
            "epistemic_note": {
                "en": "Terms are described as elements of Hubbard's system. Religious, metaphysical, or non-consensus claims are labeled. Upper OT confidential materials are not reproduced.",
                "ru": old["meta"]["epistemic_note"],
            },
        },
        "nodes": nodes,
        "relations": relations,
        "sources": sources,
        "learningPaths": paths,
        "timeline": timeline,
        "applicationTopics": app_nodes,
        "glossary": [
            {"id": "overt-act", "en": "Overt Act", "ru": "Оверт"},
            {"id": "withhold", "en": "Withhold", "ru": "Висхолд"},
            {"id": "thetan", "en": "Thetan", "ru": "Тэтан"},
            {"id": "arc-triangle", "en": "ARC Triangle", "ru": "Треугольник АРО"},
            {"id": "engram", "en": "Engram", "ru": "Инграмма"},
            {"id": "clear", "en": "Clear", "ru": "Клир"},
        ],
    }

    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# MIGRATION REPORT V2",
        "",
        f"Source nodes: {len(old_nodes)}. Canonical concepts/records: {len(concepts)}. Domains: 8. Relations: {len(relations)}.",
        "",
        "| Old ID | Old branch | New ID | Domain / view | Action | EN title | RU title | EN expl | Sources |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for oid, n in old_nodes.items():
        if oid in ("ROOT",) or n["type"] == "branch":
            if oid == "ROOT":
                lines.append(f"| ROOT | — | hubbard-knowledge-map | root | moved | Hubbard Knowledge Map | Карта знаний Хаббарда | yes | — |")
            else:
                lines.append(f"| {oid} | {n['title']} | — | absorbed into 8 domains / views | removed-as-ray | — | — | — | — |")
            continue
        nid, domain, action = MAP[oid]
        rec = concepts[nid]
        en_ok = bool(rec.get("explanation", {}).get("en") or rec["metadata"]["translationStatus"]["en"] == "verified")
        lines.append(
            f"| {oid} | {n.get('branch','')} | `{nid}` | {domain} | {action} | {rec['title']['en']} | {rec['title']['ru']} | {'ok' if rec.get('explanation',{}).get('en') else 'draft/missing'} | {', '.join(rec.get('sourceIds') or []) or 'none'} |"
        )
    lines += [
        "",
        "## Merges",
        "- M09 + P04 → `charge` (primary D04, related D07)",
        "- E07 + R03 → `personal-integrity` (primary D03, Application)",
        "",
        "## Unresolved",
        "- Full English explanations for most inherited cards are draft: RU body preserved; EN title/short are in place. First-wave sense-English still needed for long explanations.",
        "- Combined records E09 and E11 were not split yet.",
        "- Source records are partially_verified from official URLs; no fabricated pages/chapters.",
        "",
    ]
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"Wrote {REPORT}")
    print("concepts", len(concepts), "nodes", len(nodes), "rels", len(relations))


if __name__ == "__main__":
    main()
