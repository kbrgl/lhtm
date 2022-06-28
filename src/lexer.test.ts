import { lex, lexeme, LexemeType } from "./lexer.ts";
import { assertEquals } from "https://deno.land/std@0.145.0/testing/asserts.ts";

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
