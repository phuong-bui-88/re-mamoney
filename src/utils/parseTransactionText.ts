import { parseTransactionMessage } from '@services/aiTransactionParser';
import { parseLocalTransactions } from '@utils/localTransactionParser';

export interface ParsedTransactionDraft {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
}

export interface ParseTextResult {
  transactions: ParsedTransactionDraft[];
  errorMessage?: string;
}

const DEFAULT_ERROR = "Could not parse. Try 'Coffee 30k' or 'Grab 120k yesterday'";

/** Parse free text into transaction drafts (local parser first, AI fallback). Dates are not set. */
export async function parseTransactionText(text: string): Promise<ParseTextResult> {
  const local = parseLocalTransactions(text);
  if (local.length > 0) {
    return { transactions: local.map(pick) };
  }
  const result = await parseTransactionMessage(text, []);
  if (result.transactions.length > 0) {
    return { transactions: result.transactions.map(pick) };
  }
  return { transactions: [], errorMessage: result.followUpQuestion || DEFAULT_ERROR };
}

function pick(tx: ParsedTransactionDraft): ParsedTransactionDraft {
  return {
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    description: tx.description,
  };
}
