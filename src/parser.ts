import { lex, LexemeType } from "./lexer.ts";

type Expression = number | string | boolean | null;
type SExpression = Expression | SExpression[];

/**
 * Parses a string into an S-Expression.
 * @param blob The blob to parse.
 * @returns The S-Expression.
 * @throws Throws an error if the blob is not a valid S-Expression.
 */
export function parse(blob: string): SExpression {
  const lexemes = lex(blob);
  const ast: SExpression = [];
  const location: number[] = []; // Stack of positions in the AST.
  for (const lxm of lexemes) {
    switch (lxm.type) {
      case LexemeType.LParen:
        location.push(ast.length);
        ast.push([]);
        break;
      case LexemeType.RParen: {
        if (location.length === 0) {
          throw new Error("Unexpected ')'");
        }
        location.pop()!;
        break;
      }
      case LexemeType.EOF:
        break;
      default:
        throw new Error("not implemented");
    }
  }

  return ast;
}
