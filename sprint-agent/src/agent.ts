import Anthropic from "@anthropic-ai/sdk";
import { Ticket, AgentResult } from "./types.js";
import { SYSTEM_PROMPT, redPhasePrompt, greenPhasePrompt, prAndJiraPrompt } from "./prompts.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6";

const JIRA_MCP_SERVER = {
  type: "url" as const,
  url: process.env.JIRA_MCP_URL!,
  name: "jira",
  authorization_token: process.env.JIRA_TOKEN,
};

// ---------------------------------------------------------------------------
// Fetch sprint tickets from Jira via MCP
// ---------------------------------------------------------------------------

export async function getSprintTickets(): Promise<Ticket[]> {
  console.log("📋 Reading sprint tickets from Jira...");

  const response = await (client.messages.create as any)({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `List all tickets in "To Do" status from the active sprint of Jira project ${process.env.JIRA_PROJECT_KEY}.
Return a JSON array (no markdown, just raw JSON) with this shape:
[{ "id": "L1DR-X", "title": "...", "description": "...", "acceptanceCriteria": ["...", "..."], "status": "To Do" }]
Include only tickets that have acceptance criteria defined.`,
      },
    ],
    mcp_servers: [JIRA_MCP_SERVER],
  });

  const text = response.content.find((b: any) => b.type === "text")?.text ?? "[]";
  try {
    // Extract JSON from response (agent may wrap it in prose)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    console.warn("⚠️  Could not parse ticket list:", text.slice(0, 200));
    return [];
  }
}

// ---------------------------------------------------------------------------
// Process a single ticket: RED → GREEN → PR + Jira comment
// ---------------------------------------------------------------------------

export async function processTicket(ticket: Ticket): Promise<AgentResult> {
  console.log(`\n${"━".repeat(60)}`);
  console.log(`🎫 ${ticket.id}: ${ticket.title}`);
  console.log("━".repeat(60));

  try {
    // ── PHASE RED ────────────────────────────────────────────────
    console.log("  🔴 RED  — generating failing tests...");
    await runAgentPhase(redPhasePrompt(ticket), `RED:${ticket.id}`);

    // ── PHASE GREEN ──────────────────────────────────────────────
    console.log("  🟢 GREEN — implementing minimum code...");
    const greenResult = await runAgentPhase(greenPhasePrompt(ticket), `GREEN:${ticket.id}`);

    const testsMatch = greenResult.match(/(\d+)\/(\d+)\s+test/i);
    const testsCount = testsMatch ? parseInt(testsMatch[1]) : undefined;

    // ── PR + JIRA COMMENT ────────────────────────────────────────
    console.log("  📬 Opening PR and commenting on Jira...");
    const prResult = await runAgentPhase(prAndJiraPrompt(ticket), `PR:${ticket.id}`, true);

    const prUrlMatch = prResult.match(/https:\/\/github\.com\/[^\s)]+\/pull\/\d+/);
    const prUrl = prUrlMatch?.[0];

    console.log(`  ✅ Done — PR: ${prUrl ?? "check output above"}`);

    return { ticketId: ticket.id, success: true, prUrl, testsCount };
  } catch (err: any) {
    console.error(`  ❌ Failed: ${err.message}`);
    return { ticketId: ticket.id, success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Internal: run one agent conversation turn
// ---------------------------------------------------------------------------

async function runAgentPhase(
  userPrompt: string,
  label: string,
  useJiraMcp = false
): Promise<string> {
  const params: any = {
    model: MODEL,
    max_tokens: 8096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  };

  if (useJiraMcp) {
    params.mcp_servers = [JIRA_MCP_SERVER];
  }

  const response = await (client.messages.create as any)(params);
  const text = response.content.find((b: any) => b.type === "text")?.text ?? "";

  if (process.env.VERBOSE === "true") {
    console.log(`\n[${label}]\n${text}\n`);
  }

  return text;
}
