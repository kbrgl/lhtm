import { lex, Lexeme, LexemeType } from "./lexer.ts";
import { node, Node, NodeType } from "./node.ts";

function isAtom(lexeme: Lexeme) {
  return [LexemeType.Identifier, LexemeType.Number, LexemeType.String].includes(
    lexeme.type
  );
}

function toAtom(lexeme: Lexeme): Node {
  switch (lexeme.type) {
    case LexemeType.Identifier:
      return node(NodeType.Identifier, lexeme.value);
    case LexemeType.Number:
      return node(NodeType.Number, lexeme.value);
    case LexemeType.String:
      return node(
        NodeType.String,
        lexeme.value?.slice(1, lexeme.value.length - 1) || null
      );
  }
  throw new Error("passed lexeme is not atomic");
}

export function parse(lexemes: Lexeme[]): Node {
  const stack: Node[] = [node(NodeType.Program, null, [])];
  while (true) {
    const [lexeme, ...rest] = lexemes;
    lexemes = rest;
    if (isAtom(lexeme)) {
      stack[stack.length - 1].children.push(toAtom(lexeme));
    } else if (lexeme.type === LexemeType.LParen) {
      // Create a new list.
      const listNode = node(NodeType.List, null, []);
      stack[stack.length - 1].children.push(listNode);
      stack.push(listNode);
    } else if (lexeme.type === LexemeType.RParen) {
      if (stack.length <= 1) {
        throw new Error("unmatched )");
      }
      stack.pop();
    } else if (lexeme.type === LexemeType.EOF) {
      break;
    }
  }
  return stack[0];
}
