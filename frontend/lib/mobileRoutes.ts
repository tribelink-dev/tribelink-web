/** Routes where the bottom tab bar should be hidden (focused flows / sticky CTAs). */
export function shouldHideBottomNav(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname.startsWith('/trips')) return true;
  if (pathname === '/cart') return true;
  if (/^\/adobes\/[^/]+$/.test(pathname)) return true;
  if (pathname.startsWith('/bookings/payment')) return true;
  return false;
}

/** Tailwind class for sticky bottom bars — clears tab bar when visible. */
export function stickyBarBottomClass(pathname: string | null): string {
  return shouldHideBottomNav(pathname) ? 'bottom-0' : 'bottom-14';
}
