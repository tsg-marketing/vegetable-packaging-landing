import { readUtm, currentPagePath } from "@/lib/utm";
import { ymGoal, getYaClientId } from "@/lib/ym";

const LEAD_ENDPOINT = "/api/b24-send-lead.php";

export type QuizAnswer = { question: string; answer: string };

export type LeadPayload = {
  source?: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  product?: string;
  pack?: string;
  comment?: string;
  quiz?: QuizAnswer[];
  extra?: Record<string, string>;
  [key: string]: unknown;
};

function buildQuizMap(quiz: QuizAnswer[]): Record<string, string> {
  const map: Record<string, string> = {};
  quiz.forEach(a => {
    const q = (a.question || "").trim();
    const v = (a.answer || "").trim();
    if (q && v && v !== "—") map[q] = v;
  });
  return map;
}

/**
 * Создаёт функцию отправки заявки для конкретного раздела оборудования.
 * Раздел (equipment) попадает и в тело запроса, и в текст комментария —
 * чтобы в CRM всегда было видно, с какой страницы/оборудования пришла заявка.
 */
export function createLeadSender(equipment: string) {
  return async function sendLead(payload: LeadPayload): Promise<boolean> {
    try {
      const pageUrl = typeof window !== "undefined" ? window.location.href : "";
      const baseName = String(payload.name ?? "").trim();
      const nameWithUrl = baseName && pageUrl ? `${baseName} — ${pageUrl}` : baseName;
      const yaClientId = await getYaClientId();

      const quiz = Array.isArray(payload.quiz) ? payload.quiz : [];
      const quizMap = buildQuizMap(quiz);
      const extra = payload.extra && typeof payload.extra === "object" ? payload.extra : {};

      const lines: string[] = [];
      lines.push(`Раздел: ${equipment}`);
      if (payload.product) lines.push(`Интересует товар: ${payload.product}`);
      if (payload.company) lines.push(`Компания: ${payload.company}`);
      Object.entries(extra).forEach(([k, v]) => { if (v) lines.push(`${k}: ${v}`); });
      if (quiz.length > 0) {
        lines.push("— Ответы квиза —");
        quiz.forEach(a => lines.push(`${a.question} ${a.answer || "—"}`));
      }
      const userComment = String(payload.comment ?? "").trim();
      if (userComment) lines.push(userComment);
      if (yaClientId) lines.push(`ClientID: ${yaClientId}`);
      const comment = lines.join("\n");

      const body: Record<string, unknown> = {
        ...payload,
        page: currentPagePath(),
        pageUrl,
        equipment,
        source: payload.source || "site",
        name: nameWithUrl,
        phone: String(payload.phone ?? "").trim(),
        email: String(payload.email ?? "").trim(),
        product: payload.product || "",
        comment,
        message: comment,
        quizAnswers: { ...quizMap, ...extra },
        yaClientId,
        utm: readUtm(),
      };
      delete body.quiz;
      delete body.extra;

      const res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return false;
      const j = await res.json().catch(() => ({ ok: true }));
      const ok = j?.ok !== false;
      if (ok) ymGoal("FOS_send");
      return ok;
    } catch {
      return false;
    }
  };
}
