export enum NodeType {
  LParen = "LParen",
  RParen = "RParen",
  Number = "Number",
  String = "String",
  Identifier = "Identifier",
  EOF = "EOF",
  Comment = "Comment",
  HTMLComment = "HTMLComment",
  LBracket = "LBracket",
  RBracket = "RBracket",
}

export type NodeValue = string | null;

export interface Node {
  type: NodeType;
  value: NodeValue;
}

export function node(type: NodeType, value: NodeValue = null): Node {
  return {
    type,
    value,
  };
}
