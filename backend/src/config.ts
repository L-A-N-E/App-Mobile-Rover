export const config = {
  port: Number(process.env.PORT ?? 3333),
  ollamaUrl: (process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434').replace(/\/$/, ''),
  model: process.env.OLLAMA_MODEL ?? 'llama3.2:3b',
  geocoding: (process.env.GEOCODING ?? 'on').toLowerCase() !== 'off',
};
