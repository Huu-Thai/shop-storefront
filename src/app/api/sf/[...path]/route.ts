import { cookies } from 'next/headers';
import { apiBase, env, isDemo } from '@/server/env';
import { forward } from '@/server/gateway';
import { routingTable } from '@/server/routing-table';
import { getSession } from '@/server/session';

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(req: Request, { params }: Ctx): Promise<Response> {
  const { path } = await params;
  const jar = await cookies();
  const e = env();
  return forward(req, path, {
    apiBase: apiBase(),
    table: await routingTable({
      apiBase: apiBase(),
      defaultStore: e.DEFAULT_STORE,
      extraStores: e.STORES,
    }),
    session: await getSession(),
    cookie: (name) => jar.get(name)?.value,
    secure: e.NODE_ENV === 'production',
    demo: isDemo(),
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
