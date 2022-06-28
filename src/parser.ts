type Expression = number | string | boolean | null;
type SExpression = Expression | SExpression[];

/**
 * Parses a string into an S-Expression.
 * @param blob The blob to parse.
 * @returns The S-Expression.
 * @throws Throws an error if the blob is not a valid S-Expression.
 * @example
 * ```
 * parse("(a b c)")
 * // => ["a", "b", "c"]
 * ```
 */
export function parse(_blob: string): SExpression {
  throw new Error("not implemented");
}
