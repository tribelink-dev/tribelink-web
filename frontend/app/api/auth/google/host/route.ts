import { NextRequest, NextResponse } from 'next/server';

function getBackendOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  try {
    const normalized = raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;
    return new URL(normalized).origin;
  } catch {
    return 'http://localhost:5000';
  }
}

export function GET(request: NextRequest) {
  const target = new URL('/api/auth/google/host', getBackendOrigin());
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target);
}
