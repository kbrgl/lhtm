import { assertEquals } from "https://deno.land/std@0.145.0/testing/asserts.ts";
import { parse } from "./parser.ts";
import { lexeme, LexemeType } from "./lexer.ts";

Deno.test({
  name: "simple",
  fn: () => {
    assertEquals(parse("()"), [[]]);
  },
});

Deno.test({
  name: "number",
  fn: () => {
    assertEquals(parse("(1)"), [[lexeme(LexemeType.Number, "1")]]);
  },
});

Deno.test({
  name: "comment",
  fn: () => {
    assertEquals(parse("; comment"), []);
  },
});

Deno.test({
  name: "complex expression",
  fn: () => {
    assertEquals(parse("(1 2 (3 4) 5)"), [
      [
        lexeme(LexemeType.Number, "1"),
        lexeme(LexemeType.Number, "2"),
        [lexeme(LexemeType.Number, "3"), lexeme(LexemeType.Number, "4")],
        lexeme(LexemeType.Number, "5"),
      ],
    ]);
  },
});

Deno.test({
  name: "complex expression with comments",
  fn: () => {
    assertEquals(parse("(1 2 (3 4) 5) ; comment"), [
      [
        lexeme(LexemeType.Number, "1"),
        lexeme(LexemeType.Number, "2"),
        [lexeme(LexemeType.Number, "3"), lexeme(LexemeType.Number, "4")],
        lexeme(LexemeType.Number, "5"),
      ],
    ]);
  },
});
