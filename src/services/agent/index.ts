import { env } from '@/lib/env';
import { mockAgent } from './mockAgent';
import { liveAgent } from './liveAgent';
import type { AgentService } from './types';

/** Ponto único de troca: AGENT_MODE=mock | live. */
export const agentService: AgentService = env.agentMode === 'live' ? liveAgent : mockAgent;

export * from './types';
