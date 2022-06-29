import { parse } from "./parser.ts";

export function compile(blob: string): string {
  const tree = parse(blob);
}
