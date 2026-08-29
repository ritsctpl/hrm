/**
 * How a salary figure is rendered, in one place.
 *
 * <p>The server withholds figures the caller has not stepped up to see, sending null rather than a
 * number. Every screen that shows money must therefore be able to render "withheld" — and before this
 * helper there was no shared money formatter at all: roughly thirty components each called
 * `toLocaleString('en-IN')` inline. Masking screen-by-screen would have been one forgotten component
 * away from a leak, which is why the withholding happens on the server and this only draws the result.
 */
export const MASKED_PLACEHOLDER = '••••••';

/** True when the server withheld this figure, as opposed to it genuinely being zero. */
export function isMasked(value: number | null | undefined): boolean {
  return value === null || value === undefined;
}

/**
 * Formats a salary figure for display.
 *
 * A withheld value renders as dots — never as 0, which would read as "this person earns nothing"
 * and is the wrong answer to a question the viewer is simply not allowed to ask yet.
 */
export function salaryAmount(
  value: number | null | undefined,
  options: { currency?: boolean; zeroAsDash?: boolean } = {},
): string {
  if (isMasked(value)) return MASKED_PLACEHOLDER;
  const n = Number(value);
  if (options.zeroAsDash && n === 0) return '-';
  const formatted = n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return options.currency === false ? formatted : `₹${formatted}`;
}
