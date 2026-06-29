import axios from 'axios';
import { aiConfig } from './aiConfig';

export async function askFinancialQuestion(
  question: string,
  transactionsSummary: string,
): Promise<string> {
  const token = aiConfig.getToken();
  if (!token) {
    return 'GitHub token not configured. Please set EXPO_PUBLIC_GITHUB_TOKEN in your .env.local file.';
  }

  try {
    const response = await axios.post(
      aiConfig.getApiUrl(),
      {
        messages: [
          {
            role: 'system',
            content: `You are a personal finance assistant for a Vietnamese user (VND currency). 
Answer questions based on the user's transaction data provided below.

Recent transactions:
${transactionsSummary || 'No transactions available.'}

Keep answers concise, data-driven, and under 3 sentences when possible. 
Use VND formatting (e.g., "50,000đ", "2,500,000đ") for amounts.
If you cannot answer from the data, say so honestly.`,
          },
          { role: 'user', content: question },
        ],
        temperature: 0.3,
        max_tokens: 200,
        model: aiConfig.model,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      },
    );

    return (
      response.data?.choices?.[0]?.message?.content?.trim() ||
      'Sorry, I could not process that question.'
    );
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) return 'Authentication Error: Invalid or expired GitHub token.';
      if (status === 429) return 'API Rate Limited: Please wait a moment and try again.';
      return `API Error: ${error.response?.status} — ${error.message}`;
    }
    return `Network error: ${(error as Error).message}`;
  }
}
