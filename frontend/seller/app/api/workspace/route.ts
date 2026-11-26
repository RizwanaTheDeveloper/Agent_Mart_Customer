import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { createWorkspaceHandler } from '../../../../../backend/src/routes/workspace';
import type { BackendBindings } from '../../../../../backend/src/types';
export const dynamic = 'force-dynamic';
export function GET() { return createWorkspaceHandler(env as BackendBindings, getChatGPTUser).GET(); }
export function POST(request: Request) { return createWorkspaceHandler(env as BackendBindings, getChatGPTUser).POST(request); }
