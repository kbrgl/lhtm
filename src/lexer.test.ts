import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.145.0/testing/asserts.ts";
import { lex, LexemeType, lexeme } from "./lexer.ts";

Deno.test({
  name: "simple S-expression with only identifiers",
  fn: () => {
    assertEquals(lex("(ay bee cee)"), [
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Identifier, "ay"),
      lexeme(LexemeType.Identifier, "bee"),
      lexeme(LexemeType.Identifier, "cee"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "simple S-expression with only numbers",
  fn: () => {
    assertEquals(lex("(1 2352 1235.6 3.0 -5 +3 23_000 #xfF)"), [
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Number, "1"),
      lexeme(LexemeType.Number, "2352"),
      lexeme(LexemeType.Number, "1235.6"),
      lexeme(LexemeType.Number, "3.0"),
      lexeme(LexemeType.Number, "-5"),
      lexeme(LexemeType.Number, "+3"),
      lexeme(LexemeType.Number, "23_000"),
      lexeme(LexemeType.Number, "#xfF"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "simple S-expression, one string with no escapes",
  fn: () => {
    assertEquals(lex('("ay bee cee")'), [
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.String, '"ay bee cee"'),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "simple S-expression, one string with escapes",
  fn: () => {
    assertEquals(lex('("ay bee cee\\" dee ")'), [
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.String, '"ay bee cee\\" dee "'),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "comments",
  fn: () => {
    assertEquals(lex("; this is a comment\n;; another comment.'"), [
      lexeme(LexemeType.Comment, "; this is a comment"),
      lexeme(LexemeType.HTMLComment, ";; another comment.'"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "nested S-expressions",
  fn: () => {
    assertEquals(lex("(1 (2 3) 4)"), [
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Number, "1"),
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Number, "2"),
      lexeme(LexemeType.Number, "3"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.Number, "4"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.EOF, ""),
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
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Identifier, "define"),
      lexeme(LexemeType.Identifier, "x"),
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Identifier, "+"),
      lexeme(LexemeType.Number, "1"),
      lexeme(LexemeType.Number, "2"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "identifier with arithmetic operators",
  fn: () => {
    assertEquals(lex("(+ - * /)"), [
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Identifier, "+"),
      lexeme(LexemeType.Identifier, "-"),
      lexeme(LexemeType.Identifier, "*"),
      lexeme(LexemeType.Identifier, "/"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "expressions not separated by spaces",
  fn: () => {
    assertThrows(() => {
      lex("(134e6) ; comment");
    });
    assertThrows(() => {
      lex("(sdf 0.512.5)");
    });
  },
});

Deno.test({
  name: "end of line comment",
  fn: () => {
    assertEquals(lex("(1 2 3) ; comment"), [
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Number, "1"),
      lexeme(LexemeType.Number, "2"),
      lexeme(LexemeType.Number, "3"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.Comment, "; comment"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "quoted stuff",
  fn: () => {
    assertEquals(lex("(define x 'y)"), [
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Identifier, "define"),
      lexeme(LexemeType.Identifier, "x"),
      lexeme(LexemeType.SingleQuote, "'"),
      lexeme(LexemeType.Identifier, "y"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "quoted nesting",
  fn: () => {
    assertEquals(lex("(define x '(+ 2 3) ,abcdef)"), [
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Identifier, "define"),
      lexeme(LexemeType.Identifier, "x"),
      lexeme(LexemeType.SingleQuote, "'"),
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Identifier, "+"),
      lexeme(LexemeType.Number, "2"),
      lexeme(LexemeType.Number, "3"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.Comma, ","),
      lexeme(LexemeType.Identifier, "abcdef"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "#env declaration",
  fn: () => {
    assertEquals(lex("#env html\n(define x y)"), [
      lexeme(LexemeType.Env, "#env"),
      lexeme(LexemeType.Identifier, "html"),
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Identifier, "define"),
      lexeme(LexemeType.Identifier, "x"),
      lexeme(LexemeType.Identifier, "y"),
      lexeme(LexemeType.RParen, ")"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "bare #env declaration without anything else",
  fn: () => {
    assertEquals(lex("#env html"), [
      lexeme(LexemeType.Env, "#env"),
      lexeme(LexemeType.Identifier, "html"),
      lexeme(LexemeType.EOF, ""),
    ]);
  },
});

Deno.test({
  name: "typo in #env declaration",
  fn: () => {
    assertThrows(() => {
      lex("#environment html\n(define x y)");
    });
  },
});
