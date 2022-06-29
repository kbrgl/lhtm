import { node, Node, NodeType } from "./node.ts";

type StateFunction =
  | ((l: Lexer) => Generator<NodeType, StateFunction, undefined>)
  | null;

class Lexer {
  static EOF = "\0";

  blob: string;
  cursor: number;
  start: number;

  constructor(blob: string) {
    this.blob = blob;
    this.cursor = 0;
    this.start = 0;
  }

  eof() {
    return this.cursor >= this.blob.length;
  }

  next() {
    if (this.eof()) {
      return Lexer.EOF;
    } else {
      const ch = this.blob[this.cursor];
      this.cursor += 1;
      return ch;
    }
  }

  backup() {
    this.cursor -= 1;
  }

  value() {
    return this.blob.slice(this.start, this.cursor);
  }

  peek() {
    const result = this.next();
    this.backup();
    return result;
  }

  static matches(ch: string, pattern: string) {
    return pattern.includes(ch);
  }

  accept(pattern: string) {
    const ch = this.next();
    if (Lexer.matches(ch, pattern)) {
      return true;
    }
    this.backup();
    return false;
  }

  acceptRun(pattern: string) {
    while (Lexer.matches(this.next(), pattern));
    this.backup();
  }

  ignore() {
    this.start = this.cursor;
  }

  emit(lexemeType: NodeType) {
    const result = node(lexemeType, this.value());
    this.start = this.cursor;
    return result;
  }

  *run(initial: StateFunction) {
    for (let stateFn = initial; stateFn != null; ) {
      const emitter = stateFn(this);
      let item = emitter.next();
      while (!item.done) {
        const { value: lexemeType } = item;

        // Emit this node and move the cursor.
        yield this.emit(lexemeType);

        item = emitter.next();
      }
      stateFn = item.value;
    }
  }

  assert(pattern: string) {
    if (!this.accept(pattern)) {
      this.error(`expected ${pattern.toString()}`);
    }
  }

  error(message: string) {
    throw new Error(message);
  }
}

const ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGIT = "0123456789";
const ALPHANUMERIC =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const WHITESPACE = " \t\n\r";
const HEX_DIGIT = "0123456789abcdefABCDEF";

const NUMBER_START = `+\-${DIGIT}`;
const lexNumber: StateFunction = function* (l: Lexer) {
  let digits = DIGIT;
  l.accept("+-");
  if (l.accept("0") && l.accept("x")) {
    digits = HEX_DIGIT;
  }
  l.accept(digits);

  // Allow underscores after the first digit has been acceptd.
  digits += "_";
  l.acceptRun(digits);

  if (l.accept(".")) {
    l.assert(digits);
  }
  l.acceptRun(digits);

  yield NodeType.Number;
  return lexDefault;
};

const IDENTIFIER_START = `${ALPHA}_,@$`;
const IDENTIFIER = `${ALPHANUMERIC}_,:\-`;
const lexIdentifier: StateFunction = function* (l: Lexer) {
  l.accept(IDENTIFIER_START);
  l.acceptRun(IDENTIFIER);
  yield NodeType.Identifier;
  return lexDefault;
};

const STRING_START = `'"\``;
const lexString: StateFunction = function* (l: Lexer) {
  const quoteType = l.next()!;
  while (!l.eof()) {
    if (l.accept("\\")) {
      l.next();
      continue;
    }
    if (l.accept(quoteType)) {
      yield NodeType.String;
      return lexDefault;
    }
    l.next();
  }
  l.error("unterminated string");
  return null;
};

const lexComment: StateFunction = function* (l: Lexer) {
  l.accept(";");
  // The second ; turns this into an HTML comment.
  let html = false;
  if (l.accept(";")) {
    html = true;
  }

  // Consume the rest of the comment.
  while (!l.eof() && l.next() !== "\n");
  if (!l.eof()) {
    l.backup();
  }

  if (html) {
    yield NodeType.HTMLComment;
  } else {
    yield NodeType.Comment;
  }
  return lexDefault;
};

const lexDefault: StateFunction = function* (l: Lexer) {
  while (true) {
    const curr = l.next();
    if (curr === Lexer.EOF) {
      yield NodeType.EOF;
      break;
    } else if (curr == "(") {
      yield NodeType.LParen;
    } else if (curr == ")") {
      yield NodeType.RParen;
    } else if (curr == "[") {
      yield NodeType.LBracket;
    } else if (curr == "]") {
      yield NodeType.RBracket;
    } else if (curr == ";") {
      l.backup();
      return lexComment;
    } else if (Lexer.matches(curr, NUMBER_START)) {
      l.backup();
      return lexNumber;
    } else if (Lexer.matches(curr, STRING_START)) {
      l.backup();
      return lexString;
    } else if (Lexer.matches(curr, WHITESPACE)) {
      l.ignore();
    } else if (Lexer.matches(curr, IDENTIFIER_START)) {
      l.backup();
      return lexIdentifier;
    } else {
      l.error(`unexpected ${curr}`);
      break;
    }
  }
  return null;
};

export function lex(blob: string): Node[] {
  const l = new Lexer(blob);
  return Array.from(l.run(lexDefault));
}
