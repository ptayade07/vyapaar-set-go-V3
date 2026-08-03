import { buildHisaabSummaryPrompt, type HisaabSummaryData } from "./hisaab-summary";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT =
  "You are a friendly assistant writing a short end-of-day summary for a small Indian shopkeeper's " +
  "khata (ledger) app. Write 3-5 sentences in Hinglish (Roman script, casual, no Devanagari script), " +
  "warm and practical in tone. Mention the numbers given, and gently encourage collecting old udhaar " +
  "or restocking low items where relevant. Do not invent numbers or customer names beyond what is " +
  "given. Keep it under 80 words. No markdown, no headings, plain text only.";

export async function generateHisaabSummaryWithLlm(data: HisaabSummaryData): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildHisaabSummaryPrompt(data) },
        ],
      }),
    });

    if (!response.ok) return null;

    const payload = (await response.json().catch(() => null)) as {
      choices?: { message?: { content?: string } }[];
    } | null;
    const content = payload?.choices?.[0]?.message?.content?.trim();

    return content && content.length > 0 ? content : null;
  } catch {
    return null;
  }
}
