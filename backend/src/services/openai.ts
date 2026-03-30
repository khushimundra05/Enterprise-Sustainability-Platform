/**
 * openai.ts
 *
 * Generates sustainability recommendations from compliance data.
 * Uses OpenAI GPT if a real API key is configured, otherwise falls back
 * to a deterministic rule-based engine so the feature always works.
 */
import OpenAI from "openai";

function isRealKey(key: string | undefined): boolean {
  return !!key && key !== "test" && key.startsWith("sk-");
}

// ── Rule-based fallback ────────────────────────────────────────────
function generateRuleBasedRecommendations(items: any[]): string {
  if (!items || items.length === 0) {
    return `## Sustainability Recommendations
 
**No compliance records found.** Start by adding your regulatory requirements to get personalised recommendations.
 
### Getting Started
- Add your key environmental regulations (ISO 14001, GHG Protocol, local requirements)
- Set due dates to track upcoming compliance deadlines
- Log your first audit date to establish a baseline`;
  }

  const total = items.length;
  const compliant = items.filter((r) => r.status === "Compliant").length;
  const pending = items.filter((r) => r.status === "Pending").length;
  const nonCompliant = items.filter((r) => r.status === "Non-Compliant").length;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

  const overdue = items.filter((r) => {
    if (!r.dueDate) return false;
    return new Date(r.dueDate) < new Date();
  });

  const upcoming = items.filter((r) => {
    if (!r.dueDate) return false;
    const due = new Date(r.dueDate);
    const now = new Date();
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  const neverAudited = items.filter((r) => !r.lastAudit);

  let output = `## Sustainability Compliance Analysis\n\n`;
  output += `**Overall compliance rate: ${complianceRate}%** (${compliant}/${total} regulations met)\n\n`;

  // Priority alerts
  if (nonCompliant > 0) {
    output += `### 🔴 Immediate Action Required\n`;
    output += `${nonCompliant} regulation${nonCompliant > 1 ? "s are" : " is"} non-compliant. `;
    output += `Address these first to avoid regulatory penalties:\n`;
    items
      .filter((r) => r.status === "Non-Compliant")
      .forEach((r) => {
        output += `- **${r.title}**: ${r.description || "No description"}\n`;
      });
    output += `\n`;
  }

  if (overdue.length > 0) {
    output += `### ⚠️ Overdue Deadlines\n`;
    overdue.forEach((r) => {
      output += `- **${r.title}** was due on ${r.dueDate}\n`;
    });
    output += `\n`;
  }

  if (upcoming.length > 0) {
    output += `### 📅 Due Within 30 Days\n`;
    upcoming.forEach((r) => {
      output += `- **${r.title}** — due ${r.dueDate}\n`;
    });
    output += `\n`;
  }

  // Recommendations
  output += `### 💡 Recommendations\n\n`;

  if (complianceRate < 50) {
    output += `1. **Critical: Compliance rate is below 50%.** Prioritise a compliance review meeting this week and assign owners to each non-compliant item.\n`;
  } else if (complianceRate < 80) {
    output += `1. **Improve compliance rate from ${complianceRate}% to 80%+.** Focus on the ${nonCompliant + pending} outstanding items.\n`;
  } else {
    output += `1. **Strong compliance rate of ${complianceRate}%.** Maintain momentum with regular quarterly reviews.\n`;
  }

  if (neverAudited.length > 0) {
    output += `2. **${neverAudited.length} regulation${neverAudited.length > 1 ? "s have" : " has"} never been audited.** Schedule initial audits to establish baselines.\n`;
  }

  if (pending > 0) {
    output += `3. **${pending} pending review${pending > 1 ? "s" : ""}.** Assign each to a responsible team member with a target completion date.\n`;
  }

  output += `4. **Set up quarterly compliance reviews** to catch issues before they become violations.\n`;
  output += `5. **Document evidence** for compliant regulations to support future audits.\n`;

  return output;
}

// ── Main export ────────────────────────────────────────────────────
export const generateRecommendations = async (
  items: any[],
): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY;

  // Use OpenAI only if a real key is configured
  if (isRealKey(apiKey)) {
    try {
      const openai = new OpenAI({ apiKey });
      const prompt = `You are a sustainability compliance expert. Analyze this compliance data and provide specific, actionable recommendations in markdown format:\n\n${JSON.stringify(items, null, 2)}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
      });

      return (
        response.choices[0].message.content ||
        generateRuleBasedRecommendations(items)
      );
    } catch (err) {
      console.error("OpenAI call failed, using rule-based fallback:", err);
      return generateRuleBasedRecommendations(items);
    }
  }

  // No valid key — use rule-based engine
  return generateRuleBasedRecommendations(items);
};
