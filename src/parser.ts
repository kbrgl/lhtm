import { lex } from "./lexer.ts";
import { NodeType, Node } from "./node.ts";

type Tree = Node | Tree[];

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
      case NodeType.LParen:
        getTreePath(tree, path).push([]);
        path.push(getTreePath(tree, path)!.length - 1);
        break;
      case NodeType.RParen: {
        if (path.length === 0) {
          throw new Error("Unexpected ')'");
        }
        path.pop()!;
        break;
      }
      case NodeType.EOF:
        break;
      case NodeType.Comment:
      case NodeType.HTMLComment:
        break;
      default:
        getTreePath(tree, path)!.push(lxm);
    }
  }

  return tree;
}
