import { env } from 'cloudflare:workers';
import { createBuyerHandler } from '../../../../../../backend/src/routes/buyer';

export const dynamic = 'force-dynamic';
function handle(request: Request) {
  const bindings = env as Cloudflare.Env & { BUYER_ORIGINS?: string };
  return createBuyerHandler(bindings.DB, { origins: bindings.BUYER_ORIGINS?.split(',').map(origin => origin.trim()).filter(Boolean) })(request);
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const OPTIONS = handle;
