'use client';

import Link from 'next/link';
import { LOGO_PATH, LOGO_ALT_TEXT } from '@/lib/constants';

const footerLinks = {
  Support: [
    { label: 'Help Center', href: '/contact' },
    { label: 'Safety', href: '/dashboard/safety' },
  ],
  Hosting: [
    { label: 'Become a host', href: '/host/signup' },
    { label: 'Host resources', href: '/host/dashboard' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Stories', href: '/stories' },
  ],
};

export default function PlatformFooter() {
  return (
    <footer className="border-t border-border bg-surface mt-auto hidden md:block">
      <div className="w-full px-page lg:px-page-lg py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/explore" className="inline-block mb-4">
              <img src={LOGO_PATH} alt={LOGO_ALT_TEXT} className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-text-secondary max-w-xs">
              Authentic Kerala family homestays and cultural experiences guided by local hosts.
            </p>
            <a
              href="/llms.txt"
              className="text-xs text-text-secondary hover:text-text-primary mt-2 inline-block"
            >
              llms.txt
            </a>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-text-primary mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-4 text-xs text-text-secondary">
          <p>© {new Date().getFullYear()} Triberoutes. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/contact" className="hover:text-text-primary">Privacy</Link>
            <Link href="/contact" className="hover:text-text-primary">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
