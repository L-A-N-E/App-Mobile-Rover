import { useCallback, useEffect, useState } from 'react';

import { checkAiHealth } from '../services/ai';

export type AiStatus = 'checking' | 'online' | 'offline';

// Verifica se o backend + Ollama estão no ar (uma vez ao montar a tela, ou sob demanda).
export function useAiStatus() {
  const [status, setStatus] = useState<AiStatus>('checking');
  const [model, setModel] = useState<string>();

  const recheck = useCallback(async () => {
    setStatus('checking');
    const health = await checkAiHealth();
    setModel(health.model);
    setStatus(health.ok ? 'online' : 'offline');
    return health.ok;
  }, []);

  useEffect(() => {
    recheck();
  }, [recheck]);

  return { status, model, recheck, setStatus };
}
