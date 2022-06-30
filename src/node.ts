export enum NodeType {
  Program = "Program",
  List = "List",
  Identifier = "Identifier",
  Number = "Number",
  String = "String",
}

export type NodeValue = string | null;

export interface Node {
  type: NodeType;
  value: NodeValue;
  children: Node[];
}

export function node(
  type: NodeType,
  value: NodeValue,
  children: Node[] = []
): Node {
  return {
    type,
    value,
    children,
  };
}
