import { parse } from "./parser.ts";
import { assertEquals } from "https://deno.land/std@0.145.0/testing/asserts.ts";

Deno.test({
  name: "parse simple expression",
  fn: () => {
    const result = parse("(a b c)");
    assertEquals(result, ["a", "b", "c"]);
  },
});

Deno.test({
  name: "parse nested expression",
  fn: () => {
    const result = parse("(a (b c) d)");
    assertEquals(result, ["a", ["b", "c"], "d"]);
  },
});

Deno.test({
  name: "parse comment",
  fn: () => {
    const result = parse("(a ; comment\nb c)");
    assertEquals(result, ["a", "b", "c"]);
  },
});

Deno.test({
  name: "parse with redundant whitespace, including newlines",
  fn: () => {
    const result = parse("(a\n  b\n  c)");
    assertEquals(result, ["a", "b", "c"]);
  },
});
