import { Lexeme, LexemeType } from "./lexer.ts";
import { node, Node, NodeType } from "./node.ts";

function isAtom(lexeme: Lexeme) {
  return [
    LexemeType.Identifier,
    LexemeType.Number,
    LexemeType.String,
    LexemeType.HTMLComment,
  ].includes(lexeme.type);
}

function isSpecial(lexeme: Lexeme): boolean {
  return [
    LexemeType.Backtick,
    LexemeType.Comma,
    LexemeType.SingleQuote,
  ].includes(lexeme.type);
}

type SpecialForm = "quasiquote" | "quote" | "unquote";

function toSpecialForm(lexeme: Lexeme): SpecialForm {
  switch (lexeme.type) {
    case LexemeType.Backtick:
      return "quasiquote";
    case LexemeType.Comma:
      return "unquote";
    case LexemeType.SingleQuote:
      return "quote";
  }
  throw new Error("unimplemented special form");
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
        lexeme.value?.slice(1, lexeme.value.length - 1)!
      );
  }
  throw new Error("passed lexeme is not atomic");
}

export function parse(lexemes: Lexeme[]): Node {
  const stack: Node[] = [node(NodeType.Environment, null, [])];
  while (true) {
    const lexeme = lexemes[0];
    if (lexeme.type === LexemeType.EOF) {
      break;
    }

    lexemes.shift();

    if (isAtom(lexeme)) {
      stack[stack.length - 1].children.push(toAtom(lexeme));
      continue;
    }
    if (lexeme.type === LexemeType.LParen) {
      // Create a new list.
      const listNode = node(NodeType.List, null, []);
      stack[stack.length - 1].children.push(listNode);
      stack.push(listNode);
      continue;
    }
    if (lexeme.type === LexemeType.RParen) {
      // Pop the stack.
      if (stack.length <= 1) {
        throw new Error("unmatched )");
      }
      stack.pop();
      continue;
    }
    if (isSpecial(lexeme)) {
      const specialFormNode = node(
        NodeType.Identifier,
        toSpecialForm(lexeme),
        []
      );
      // Need to peek ahead by one lexeme. We know there's an EOF pending, so
      // it's safe to assume lexemes has at least one element.
      const next = lexemes[0];
      if (isAtom(next)) {
        const listNode = node(NodeType.List, null, [
          specialFormNode,
          toAtom(lexeme),
        ]);
        stack[stack.length - 1].children.push(listNode);
      } else if (next.type === LexemeType.LParen) {
        const listNode = node(NodeType.List, null, [specialFormNode]);
        stack[stack.length - 1].children.push(listNode);
        stack.push(listNode);
      } else {
        throw new Error(`${lexeme.value} at illegal position`);
      }
      // Eat up the next token, since we've already taken care of it.
      lexemes.shift();
      continue;
    }
    if (lexeme.type === LexemeType.Comment) {
      // Do nothing.
      continue;
    }
    throw new Error(`unexpected ${lexeme.type} ${lexeme.value}`);
  }
  if (stack.length !== 1) {
    throw new Error("unmatched (");
  }
  return stack[0];
}
