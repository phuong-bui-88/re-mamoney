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

  it('should parse a single transaction', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content:
                'TRANSACTION: Coffee | 30000 | food | expense | 29-06-2026',
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
    expect(result.transactions[0].date).toBe('29-06-2026');
    expect(result.followUpQuestion).toBeUndefined();
  });

  it('should parse multiple transactions', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content:
                'TRANSACTION: Lunch | 80000 | food | expense | 29-06-2026\nTRANSACTION: Taxi | 120000 | transport | expense | 29-06-2026',
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
                'TRANSACTION: Salary | 20000000 | salary | income | 29-06-2026',
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
