jest.unmock('@services/aiTransactionParser');

import axios from 'axios';
jest.mock('axios');

import { parseTransactionMessage } from '@services/aiTransactionParser';
import { aiConfig } from './aiConfig';

const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_GITHUB_TOKEN = 'test-token';
});

describe('parseTransactionMessage', () => {
  it('should return error if no token configured', async () => {
    delete process.env.EXPO_PUBLIC_GITHUB_TOKEN;
    const result = await parseTransactionMessage('coffee 30k');
    expect(result.transactions).toHaveLength(0);
    expect(result.followUpQuestion).toContain('token');
  });

  it('should include today\'s date in the AI system prompt', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content:
                'TRANSACTION: Lunch | 50000 | food | expense | 01-07-2026',
            },
          },
        ],
      },
    });

    await parseTransactionMessage('Lunch 50k');

    const body = mockedAxios.post.mock
      .calls[0][1] as { messages: Array<{ role: string; content: string }> };
    const systemMsg = body.messages.find(m => m.role === 'system')!.content;

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayStr = `${day}-${month}-${year}`;

    expect(systemMsg).toContain(`Today's date is ${todayStr}`);
    expect(systemMsg).toContain(`Default to today's date (${todayStr}) if no date mentioned`);
    expect(systemMsg).not.toMatch(/\|\s*29-06-2026\b/);
  });

  it('should parse a single transaction', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content:
                'TRANSACTION: Coffee | 30000 | food | expense | 01-07-2026',
            },
          },
        ],
      },
    });

    const result = await parseTransactionMessage('coffee 30k');
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].description).toBe('Coffee');
    expect(result.transactions[0].amount).toBe(30000);
    expect(result.transactions[0].category).toBe('food');
    expect(result.transactions[0].type).toBe('expense');
    expect(result.transactions[0].date).toBe('01-07-2026');
    expect(result.followUpQuestion).toBeUndefined();
  });

  it('should parse multiple transactions', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content:
                'TRANSACTION: Lunch | 80000 | food | expense | 01-07-2026\nTRANSACTION: Taxi | 120000 | transport | expense | 01-07-2026',
            },
          },
        ],
      },
    });

    const result = await parseTransactionMessage('lunch 80k, taxi 120k');
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].description).toBe('Lunch');
    expect(result.transactions[1].description).toBe('Taxi');
    expect(result.transactions[1].amount).toBe(120000);
  });

  it('should handle income', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content:
                'TRANSACTION: Salary | 20000000 | salary | income | 01-07-2026',
            },
          },
        ],
      },
    });

    const result = await parseTransactionMessage('salary 20m');
    expect(result.transactions[0].type).toBe('income');
    expect(result.transactions[0].amount).toBe(20000000);
  });

  it('should return followUp for unparseable input', async () => {
    mockedAxios.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401 },
      message: 'Unauthorized',
    });

    const result = await parseTransactionMessage('');
    expect(result.transactions).toHaveLength(0);
    expect(result.followUpQuestion).toBeTruthy();
  });
});
