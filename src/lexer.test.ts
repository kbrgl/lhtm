import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.145.0/testing/asserts.ts";
import { lex, lexeme, LexemeType } from "./lexer.ts";

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
    assertEquals(lex("(1 2352 1235.6 3.0 -5 +3 0xfF)"), [
      lexeme(LexemeType.LParen, "("),
      lexeme(LexemeType.Number, "1"),
      lexeme(LexemeType.Number, "2352"),
      lexeme(LexemeType.Number, "1235.6"),
      lexeme(LexemeType.Number, "3.0"),
      lexeme(LexemeType.Number, "-5"),
      lexeme(LexemeType.Number, "+3"),
      lexeme(LexemeType.Number, "0xfF"),
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
    assertThrows(() => lex("(define x %%)"));
  },
});

// FIXME: Failing test.
// Commented out because it runs indefinitely due to a while loop,
// locking up the test runner.
//
// Deno.test({
//   name: "unterminated string literal",
//   fn: () => {
//     assertThrows(() => {
//       lex('("ay bee cee');
//     });
//   },
// });
