'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Poker' },
  { href: '/blackjack', label: 'Blackjack' },
  { href: '/blackjack/counting-trainer', label: 'Conteggio' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/settings', label: 'Impostazioni' },
];

export function NavBar({ title }: { title: string }) {
  const pathname = usePathname();

  // Segment-boundary matching, then keep only the most specific (longest href) match active,
  // so e.g. "/blackjack/counting-trainer" highlights "Conteggio" and not also "Blackjack".
  const matches = LINKS.filter((link) => (link.href === '/' ? pathname === '/' : pathname === link.href || pathname.startsWith(`${link.href}/`)));
  const bestMatchHref = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className="mb-4 flex w-full max-w-4xl items-center justify-between">
      <h1 className="text-2xl font-bold">{title}</h1>
      <nav className="flex items-center gap-4 text-sm">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={link.href === bestMatchHref ? 'font-semibold text-amber-300' : 'text-sky-400 hover:text-sky-300'}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
