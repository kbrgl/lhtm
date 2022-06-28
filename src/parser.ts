import { lex, LexemeType, Lexeme } from "./lexer.ts";

export type Node = Lexeme;
type Tree = Node | Tree[];

export function node(type: LexemeType, value: string): Node {
  return {
    type,
    value,
  };
}

function getTreePath(tree: Tree[], path: number[]): Tree[] {
  if (path.length === 0) {
    return tree;
  } else {
    const [head, ...tail] = path;
    return getTreePath(tree[head] as Tree[], tail);
  }
}

/**
 * Parses a string into an S-Expression.
 * @param blob The blob to parse.
 * @returns The S-Expression.
 * @throws Throws an error if the blob is not a valid S-Expression.
 */
export function parse(blob: string): Tree {
  const lexemes = lex(blob);
  const tree: Tree = [];
  const path: number[] = []; // Stack of positions in the AST.

  for (const lxm of lexemes) {
    switch (lxm.type) {
      case LexemeType.LParen:
        getTreePath(tree, path).push([]);
        path.push(getTreePath(tree, path)!.length - 1);
        break;
      case LexemeType.RParen: {
        if (path.length === 0) {
          throw new Error("Unexpected ')'");
        }
        path.pop()!;
        break;
      }
      case LexemeType.EOF:
        break;
      case LexemeType.Comment:
      case LexemeType.HTMLComment:
        break;
      default:
        getTreePath(tree, path)!.push(lxm);
    }
  }

  return tree;
}
