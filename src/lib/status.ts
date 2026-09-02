import type { Lang, StatusKey } from "../types";

export type StatusKind = StatusKey | "other";

export type StatusGroup = {
  id: StatusKind;
  labelEn: string;
  labelRu: string;
};

export const STATUS_GROUPS: StatusGroup[] = [
  { id: "internal_model", labelEn: "Model within Hubbard's system", labelRu: "Модель внутри системы Хаббарда" },
  { id: "historical_dianetics_model", labelEn: "Historical Dianetics model", labelRu: "Историческая модель Дианетики" },
  { id: "religious_doctrinal_claim", labelEn: "Religious / doctrinal claim", labelRu: "Религиозно-доктринальное утверждение" },
  { id: "internal_technical_term", labelEn: "Internal technical term", labelRu: "Внутренний технический термин" },
  { id: "organizational_framework", labelEn: "Organizational framework", labelRu: "Организационная модель" },
  { id: "formal_system_statement", labelEn: "Formal system statement", labelRu: "Формальное положение системы" },
];

export function classifyStatus(status?: string, key?: StatusKey): StatusKind {
  if (key) return key;
  if (!status) return "other";
  if (/не науч|не медицин|не клинич|не валид|не установлен|проверять по/i.test(status)) {
    return "historical_dianetics_model";
  }
  if (/религ|доктрин|метафиз|духовн/i.test(status)) return "religious_doctrinal_claim";
  if (/Административ|организационн|Норматив/i.test(status)) return "organizational_framework";
  if (/Формальн|исходные положения|Методолог/i.test(status)) return "formal_system_statement";
  if (/Термин|Практика|Внутренний|инструмент|кодекс|маршрут/i.test(status)) return "internal_technical_term";
  if (/Модель|эвристика|гипотеза|типология|конструкт|концепт|Раздел карты/i.test(status)) {
    return "internal_model";
  }
  return "other";
}

export function statusLabel(kind: StatusKind, lang: Lang = "en"): string {
  const group = STATUS_GROUPS.find((g) => g.id === kind);
  if (!group) return lang === "ru" ? "Другое" : "Other";
  return lang === "ru" ? group.labelRu : group.labelEn;
}
