import { NextRequest } from 'next/server';

const UPSTREAM = (
  process.env.API_UPSTREAM_ORIGIN || 'https://api.triberoutes.com'
).replace(/\/$/, '');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Vercel Pro; Hobby caps lower — still better than client→api CORS failures. */
export const maxDuration = 300;

function buildTarget(pathParts: string[] | undefined, search: string) {
  const path = (pathParts ?? []).join('/');
  const base = path ? `${UPSTREAM}/api/${path}` : `${UPSTREAM}/api`;
  const u = new URL(base);
  u.search = search;
  return u.toString();
}

async function proxy(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path: pathParts } = await context.params;
  const target = buildTarget(pathParts, req.nextUrl.search);

  const headers = new Headers();
  const auth = req.headers.get('authorization');
  if (auth) headers.set('authorization', auth);
  const ct = req.headers.get('content-type');
  if (ct) headers.set('content-type', ct);

  const method = req.method.toUpperCase();
  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers,
    redirect: 'manual',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = req.body;
    init.duplex = 'half';
  }

  try {
    const upstreamRes = await fetch(target, init);
    const out = new Headers(upstreamRes.headers);
    out.delete('set-cookie');

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: out,
    });
  } catch (e) {
    console.error('[tr-api proxy]', target, e);
    return Response.json(
      { message: 'Upstream API unreachable', error: String(e) },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
