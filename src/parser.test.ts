import { assertEquals } from "https://deno.land/std@0.145.0/testing/asserts.ts";
import { parse } from "./parser.ts";
import { node, NodeType } from "./node.ts";

Deno.test({
  name: "simple",
  fn: () => {
    assertEquals(parse("()"), [[]]);
  },
});

Deno.test({
  name: "number",
  fn: () => {
    assertEquals(parse("(1)"), [[node(NodeType.Number, "1")]]);
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
        node(NodeType.Number, "1"),
        node(NodeType.Number, "2"),
        [node(NodeType.Number, "3"), node(NodeType.Number, "4")],
        node(NodeType.Number, "5"),
      ],
    ]);
  },
});

Deno.test({
  name: "complex expression with comments",
  fn: () => {
    assertEquals(parse("(1 2 (3 4) 5) ; comment"), [
      [
        node(NodeType.Number, "1"),
        node(NodeType.Number, "2"),
        [node(NodeType.Number, "3"), node(NodeType.Number, "4")],
        node(NodeType.Number, "5"),
      ],
    ]);
  },
});
