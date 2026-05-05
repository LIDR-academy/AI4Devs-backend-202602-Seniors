export interface Ticket {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: string;
}

export interface AgentResult {
  ticketId: string;
  success: boolean;
  prUrl?: string;
  testsCount?: number;
  error?: string;
}

export interface SprintSummary {
  processed: number;
  succeeded: number;
  failed: number;
  results: AgentResult[];
}
