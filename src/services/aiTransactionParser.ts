import axios from 'axios';
import { AIParseResult, AITransaction } from '@/types';
import { aiConfig } from './aiConfig';
import { CATEGORY_LABELS } from '@utils/categories';

const CATEGORIES_LIST = Object.keys(CATEGORY_LABELS).join(', ');

function buildSystemPrompt(): string {
  return `You are a personal finance assistant for a Vietnamese user (VND currency). Convert natural language into structured transactions.

CATEGORIES (use only these exact keys):
${CATEGORIES_LIST}

CATEGORY MAPPING RULES (use your knowledge to map):
- Food & dining: restaurants, cafes, coffee, pho, lunch, dinner, breakfast, food items, Starbucks, Highlands Coffee, Circle K snacks
- Transport: Grab, taxi, bus, metro, gas, parking, airport, bike, car
- Entertainment: Netflix, cinema, movie, game, Spotify, concert
- Shopping: groceries, supermarket, clothing, online shopping, Tiki, Shopee, Lazada
- Health & Medical: pharmacy, doctor, hospital, gym, medicine
- Utilities: electricity, water, internet, phone bill, rent
- Salary: monthly salary, wage, paycheck
- Bonus: bonus, bonus salary, tet bonus
- Freelance: freelance, side project, contract work
- Investment: stock, crypto, interest, dividend
- Other: anything else

AMOUNT RULES (VND only):
- "25k" or "25 K" = 25000
- "2.5m" or "2.5 M" = 2500000
- "2 triệu" or "2tr" = 2000000
- "1 tỉ" or "1b" = 1000000000
- "20.000" or "20,000" = 20000
- Plain numbers like "50000" = 50000
- "$20" or "20 USD" — convert at 1 USD = 25000 VND → 500000
- Output number only, no commas, no currency symbols

DATE RULES:
- Understand relative dates: "today", "yesterday", "tomorrow", "last Friday", "this Monday", "3 days ago", "June 20", "20/06", "20-06-2026"
- Convert ALL dates to DD-MM-YYYY format
- Use the current year (2026) for dates without a year
- Default to today's date if no date mentioned

OUTPUT FORMAT:
For each transaction, return exactly one line:
TRANSACTION: description | amount | category | type | date

EXAMPLES:
Input: "hủ tiếu 25k"
Output: TRANSACTION: hủ tiếu | 25000 | food | expense | 29-06-2026

Input: "Starbucks 120k yesterday"
Output: TRANSACTION: Starbucks | 120000 | food | expense | 28-06-2026

Input: "Grab 120k last Friday"
Output: TRANSACTION: Grab | 120000 | transport | expense | 26-06-2026

Input: "Netflix 350k"
Output: TRANSACTION: Netflix | 350000 | entertainment | expense | 29-06-2026

Input: "salary 20m"
Output: TRANSACTION: Salary | 20000000 | salary | income | 29-06-2026

Input: "lunch 80k\ntaxi 120k"
Output:
TRANSACTION: Lunch | 80000 | food | expense | 29-06-2026
TRANSACTION: Taxi | 120000 | transport | expense | 29-06-2026

Input: "coffee"
Output: (empty — cannot determine amount)

Input: "500k"
Output: (empty — cannot determine description or type)

MULTI-TRANSACTION: Support comma-separated or newline-separated items.
CORRECTIONS: If user says "Actually 60k" or similar correction, look at the last transaction in conversation history and update its amount.

Pay attention: return the raw output only, no explanation.`;
}

function parseResponse(responseText: string): AIParseResult {
  const transactions: AITransaction[] = [];

  const txRegex = /TRANSACTION:\s*([^|]+)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\w+)\s*\|\s*(expense|income)\s*\|\s*(\d{2}-\d{2}-\d{4})/gi;
  let match: RegExpExecArray | null;

  while ((match = txRegex.exec(responseText)) !== null) {
    transactions.push({
      description: match[1].trim(),
      amount: Math.round(parseFloat(match[2])),
      category: match[3].trim().toLowerCase(),
      type: match[4].trim().toLowerCase() as 'expense' | 'income',
      date: match[5].trim(),
    });
  }

  return { transactions, rawResponse: responseText };
}

export async function parseTransactionMessage(
  message: string,
  history: Array<{ role: string; content: string }> = [],
): Promise<AIParseResult> {
  const token = aiConfig.getToken();
  if (!token) {
    return {
      transactions: [],
      followUpQuestion:
        'GitHub token not configured. Please set EXPO_PUBLIC_GITHUB_TOKEN in your .env.local file.',
      rawResponse: '',
    };
  }

  try {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: buildSystemPrompt() },
      ...history.slice(-20),
      { role: 'user', content: message },
    ];

    const response = await axios.post(
      aiConfig.getApiUrl(),
      {
        messages,
        temperature: 0.3,
        max_tokens: 300,
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

    const rawText = response.data?.choices?.[0]?.message?.content?.trim() || '';
    const result = parseResponse(rawText);

    if (result.transactions.length === 0 && !result.followUpQuestion) {
      result.followUpQuestion =
        "I couldn't understand that. Try something like: 'Coffee 30k' or 'lunch 80k, taxi 120k'";
    }

    return result;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) {
        return {
          transactions: [],
          followUpQuestion:
            'Authentication Error: Invalid or expired GitHub token. Check your EXPO_PUBLIC_GITHUB_TOKEN.',
          rawResponse: '',
        };
      }
      if (status === 429) {
        return {
          transactions: [],
          followUpQuestion:
            'API Rate Limited: Please wait a moment and try again.',
          rawResponse: '',
        };
      }
      return {
        transactions: [],
        followUpQuestion: `API Error: ${error.response?.status} — ${error.message}`,
        rawResponse: '',
      };
    }
    return {
      transactions: [],
      followUpQuestion: `Network error: ${(error as Error).message}`,
      rawResponse: '',
    };
  }
}
