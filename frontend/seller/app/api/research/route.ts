import { getChatGPTUser } from '../../chatgpt-auth';
import { createResearchHandler } from '../../../../../backend/src/routes/research';
export const dynamic = 'force-dynamic';
export const GET = createResearchHandler(getChatGPTUser);
