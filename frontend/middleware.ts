import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ALLOWED_BOTS =
  /googlebot|bingbot|gptbot|chatgpt-user|perplexitybot|claudebot|google-extended|applebot|facebookexternalhit|linkedinbot|twitterbot|slackbot|discordbot/i;

const BLOCKED_SCRAPERS =
  /httrack|scrapy|python-requests|curl\/|wget\/|libwww-perl|java\/|go-http-client|httpclient|okhttp|aiohttp|node-fetch|axios\/|postmanruntime/i;

function isBlockedScraper(userAgent: string): boolean {
  if (!userAgent) return false;
  if (ALLOWED_BOTS.test(userAgent)) return false;
  return BLOCKED_SCRAPERS.test(userAgent);
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  if (isBlockedScraper(userAgent)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Redirect root path to the Explore page on the edge,
  // so the marketing/landing page never flashes before navigation.
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/explore';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
