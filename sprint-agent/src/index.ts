/**
 * Sprint Agent — Entry point
 *
 * Reads To Do tickets from the active Jira sprint and processes them
 * following TDD: RED (tests) → GREEN (implementation) → PR + Jira comment.
 *
 * Usage:
 *   cp .env.example .env && fill in values
 *   npm install
 *   npm start
 *
 * Or for a single ticket:
 *   TICKET_ID=L1DR-13 npm start
 *
 * Or verbose output:
 *   VERBOSE=true npm start
 */

import "dotenv/config";
import { getSprintTickets, processTicket } from "./agent.js";
import { SprintSummary, Ticket } from "./types.js";

// ---------------------------------------------------------------------------
// Validate environment
// ---------------------------------------------------------------------------

function validateEnv(): void {
  const required = ["ANTHROPIC_API_KEY", "JIRA_MCP_URL", "JIRA_TOKEN", "JIRA_PROJECT_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(", ")}`);
    console.error("   Copy .env.example → .env and fill in the values.");
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  validateEnv();

  console.log("🚀 Sprint Agent starting...");
  console.log(`   Model  : ${process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6"}`);
  console.log(`   Project: ${process.env.JIRA_PROJECT_KEY}`);
  console.log(`   Repo   : ${process.env.GITHUB_REPO}\n`);

  // Support single-ticket mode for demos
  let tickets: Ticket[];

  if (process.env.TICKET_ID) {
    console.log(`🎯 Single-ticket mode: ${process.env.TICKET_ID}\n`);
    tickets = [
      {
        id: process.env.TICKET_ID,
        title: process.env.TICKET_TITLE ?? "(title from Jira)",
        description: process.env.TICKET_DESC ?? "",
        acceptanceCriteria: [],
        status: "To Do",
      },
    ];
  } else {
    tickets = await getSprintTickets();
  }

  if (tickets.length === 0) {
    console.log("✅ No To Do tickets in the sprint. Nothing to process.");
    return;
  }

  const maxTickets = parseInt(process.env.MAX_TICKETS_PER_RUN ?? "10");
  const toProcess = tickets.slice(0, maxTickets);

  console.log(`📋 Processing ${toProcess.length} ticket(s):`);
  toProcess.forEach((t) => console.log(`   • ${t.id}: ${t.title}`));

  const summary: SprintSummary = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    results: [],
  };

  for (const ticket of toProcess) {
    const result = await processTicket(ticket);
    summary.results.push(result);
    summary.processed++;
    result.success ? summary.succeeded++ : summary.failed++;
  }

  // ── Final report ────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(60)}`);
  console.log("📊 Sprint Agent — Run complete");
  console.log("═".repeat(60));
  console.log(`   Processed : ${summary.processed}`);
  console.log(`   Succeeded : ${summary.succeeded}`);
  console.log(`   Failed    : ${summary.failed}`);
  console.log("");

  summary.results.forEach((r) => {
    const icon = r.success ? "✅" : "❌";
    const detail = r.success
      ? `PR: ${r.prUrl ?? "opened"} | Tests: ${r.testsCount ?? "?"}`
      : `Error: ${r.error}`;
    console.log(`   ${icon} ${r.ticketId} — ${detail}`);
  });

  if (summary.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ Unhandled error:", err.message);
  process.exit(1);
});
