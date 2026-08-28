/**
 * Formats a chip count with "." as thousands separator (Italian convention),
 * without relying on Intl/toLocaleString — Node's default (small-icu) build
 * and the browser disagree on non-English locale data, which causes a
 * server/client text mismatch (React hydration error) if used during render.
 */
export function formatChips(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const digits = Math.trunc(Math.abs(amount)).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${grouped}`;
}
