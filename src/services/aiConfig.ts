const ENDPOINT = 'https://models.github.ai/inference';
const MODEL = 'openai/gpt-4.1';

export const aiConfig = {
  endpoint: ENDPOINT,
  model: MODEL,
  getApiUrl: (): string => `${ENDPOINT}/chat/completions`,
  getToken: (): string => process.env.EXPO_PUBLIC_GITHUB_TOKEN || '',
};
