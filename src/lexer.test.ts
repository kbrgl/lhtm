import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.145.0/testing/asserts.ts";
import { lex } from "./lexer.ts";
import { node, NodeType } from "./node.ts";

Deno.test({
  name: "simple S-expression with only identifiers",
  fn: () => {
    assertEquals(lex("(ay bee cee)"), [
      node(NodeType.LParen, "("),
      node(NodeType.Identifier, "ay"),
      node(NodeType.Identifier, "bee"),
      node(NodeType.Identifier, "cee"),
      node(NodeType.RParen, ")"),
      node(NodeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "simple S-expression with only numbers",
  fn: () => {
    assertEquals(lex("(1 2352 1235.6 3.0 -5 +3 23_000 #xfF)"), [
      node(NodeType.LParen, "("),
      node(NodeType.Number, "1"),
      node(NodeType.Number, "2352"),
      node(NodeType.Number, "1235.6"),
      node(NodeType.Number, "3.0"),
      node(NodeType.Number, "-5"),
      node(NodeType.Number, "+3"),
      node(NodeType.Number, "23_000"),
      node(NodeType.Number, "#xfF"),
      node(NodeType.RParen, ")"),
      node(NodeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "simple S-expression, one string with no escapes",
  fn: () => {
    assertEquals(lex('("ay bee cee")'), [
      node(NodeType.LParen, "("),
      node(NodeType.String, '"ay bee cee"'),
      node(NodeType.RParen, ")"),
      node(NodeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "simple S-expression, one string with escapes",
  fn: () => {
    assertEquals(lex('("ay bee cee\\" dee ")'), [
      node(NodeType.LParen, "("),
      node(NodeType.String, '"ay bee cee\\" dee "'),
      node(NodeType.RParen, ")"),
      node(NodeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "comments",
  fn: () => {
    assertEquals(lex("; this is a comment\n;; another comment.'"), [
      node(NodeType.Comment, "; this is a comment"),
      node(NodeType.HTMLComment, ";; another comment.'"),
      node(NodeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "nested S-expressions",
  fn: () => {
    assertEquals(lex("(1 (2 3) 4)"), [
      node(NodeType.LParen, "("),
      node(NodeType.Number, "1"),
      node(NodeType.LParen, "("),
      node(NodeType.Number, "2"),
      node(NodeType.Number, "3"),
      node(NodeType.RParen, ")"),
      node(NodeType.Number, "4"),
      node(NodeType.RParen, ")"),
      node(NodeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "invalid input",
  fn: () => {
    assertThrows(() => lex("(define x !#FDF)"));
  },
});

Deno.test({
  name: "unterminated string literal",
  fn: () => {
    assertThrows(() => {
      lex('("x');
    });
  },
});

Deno.test({
  name: "invalid number",
  fn: () => {
    assertThrows(() => {
      lex("(1.2.3)");
    });
  },
});

Deno.test({
  name: "number with invalid suffix",
  fn: () => {
    assertThrows(() => {
      lex("(1.2e3)");
    });
  },
});

Deno.test({
  name: "valid missed space",
  fn: () => {
    assertEquals(lex("(define x(+ 1 2))"), [
      node(NodeType.LParen, "("),
      node(NodeType.Identifier, "define"),
      node(NodeType.Identifier, "x"),
      node(NodeType.LParen, "("),
      node(NodeType.Identifier, "+"),
      node(NodeType.Number, "1"),
      node(NodeType.Number, "2"),
      node(NodeType.RParen, ")"),
      node(NodeType.RParen, ")"),
      node(NodeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "identifier with arithmetic operators",
  fn: () => {
    assertEquals(lex("(+ - * /)"), [
      node(NodeType.LParen, "("),
      node(NodeType.Identifier, "+"),
      node(NodeType.Identifier, "-"),
      node(NodeType.Identifier, "*"),
      node(NodeType.Identifier, "/"),
      node(NodeType.RParen, ")"),
      node(NodeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "expressions not separated by spaces",
  fn: () => {
    assertThrows(() => {
      lex("(''134e6) ; comment");
    });
    assertThrows(() => {
      lex("(''sdf)");
    });
  },
});

Deno.test({
  name: "end of line comment",
  fn: () => {
    assertEquals(lex("(1 2 3) ; comment"), [
      node(NodeType.LParen, "("),
      node(NodeType.Number, "1"),
      node(NodeType.Number, "2"),
      node(NodeType.Number, "3"),
      node(NodeType.RParen, ")"),
      node(NodeType.Comment, "; comment"),
      node(NodeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "symbols",
  fn: () => {
    assertEquals(lex("(define x 'y)"), [
      node(NodeType.LParen, "("),
      node(NodeType.Identifier, "define"),
      node(NodeType.Identifier, "x"),
      node(NodeType.Symbol, "'y"),
      node(NodeType.RParen, ")"),
      node(NodeType.EOF, ""),
    ]);
  },
});
