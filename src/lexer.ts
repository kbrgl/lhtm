export enum LexemeType {
  LParen = "LParen",
  RParen = "RParen",
  Number = "Number",
  String = "String",
  Identifier = "Identifier",
  EOF = "EOF",
  Comment = "Comment",
  HTMLComment = "HTMLComment",
}

export type LexemeValue = string | null;

export interface Lexeme {
  type: LexemeType;
  value: LexemeValue;
}

export function lexeme(type: LexemeType, value: LexemeValue = null): Lexeme {
  return {
    type,
    value,
  };
}

type StateFunction =
  | ((l: Lexer) => Generator<LexemeType, StateFunction, undefined>)
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
    this.cursor += 1;
    if (this.eof()) {
      return Lexer.EOF;
    } else {
      return this.blob[this.cursor];
    }
  }

  current() {
    return this.blob[this.cursor];
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

  match(s: string | RegExp) {
    const char = this.current();
    return (
      (s instanceof RegExp && s.test(char)) ||
      (typeof s === "string" && s.includes(char))
    );
  }

  consume(s: string | RegExp) {
    if (this.match(s)) {
      this.next();
      return true;
    }
    return false;
  }

  consumeRun(s: string | RegExp) {
    while (this.consume(s));
  }

  ignore() {
    this.start = this.cursor;
  }

  emit(lexemeType: LexemeType) {
    const result = lexeme(lexemeType, this.value());
    this.start = this.cursor;
    return result;
  }

  *run(initial: StateFunction) {
    for (let stateFn = initial; stateFn != null; ) {
      const emitter = stateFn(this);
      let item = emitter.next();
      while (!item.done) {
        const { value: lexemeType } = item;

        // Emit this lexeme and move the cursor.
        yield this.emit(lexemeType);

        item = emitter.next();
      }
      stateFn = item.value;
    }
  }

  assert(s: string | RegExp) {
    if (!this.consume(s)) {
      this.error(`expected ${s.toString()}`);
    }
  }

  error(message: string) {
    throw new Error(message);
  }
}

const Sentinels = {
  NUMBER_START: /[+-0-9]/,
  IDENTIFIER_START: /[_a-zA-Z,@]/,
  WHITESPACE: /\s/,
  STRING_START: `'"\``,
};

const lexNumber: StateFunction = function* (l: Lexer) {
  let digits = "1234567890";
  l.consume("+-");
  if (l.consume("0") && l.consume("x")) {
    digits = "123456789abcdef";
  }
  l.consume(digits);

  // Allow underscores after the first digit has been consumed.
  digits += "_";
  l.consumeRun(digits);

  if (l.consume(".")) {
    l.assert(digits);
  }
  l.consumeRun(digits);

  yield LexemeType.Number;
  return lexDefault;
};

const lexIdentifier: StateFunction = function* (l: Lexer) {
  l.consume(Sentinels.IDENTIFIER_START);
  l.consumeRun(/[_a-zA-Z0-9,:\-]/);
  yield LexemeType.Identifier;
  return lexDefault;
};

const lexString: StateFunction = function* (l: Lexer) {
  const quoteType = l.next();
  while (true) {
    l.consumeRun(new RegExp(`[^${quoteType}\\]`));
    if (l.consume(quoteType)) {
      break;
    }
    if (l.consume("\\")) {
      l.next();
    }
  }
  yield LexemeType.String;
  return lexDefault;
};

const lexComment: StateFunction = function* (l: Lexer) {
  l.consume(";");
  let html = false;
  if (l.consume(";")) {
    html = true;
  }

  while (!l.eof()) {
    if (!l.consume(/[^\n]/)) {
      break;
    }
  }

  if (html) {
    yield LexemeType.HTMLComment;
  } else {
    yield LexemeType.Comment;
  }
  return lexDefault;
};

const lexDefault: StateFunction = function* (l: Lexer) {
  while (true) {
    if (l.current() === Lexer.EOF) {
      yield LexemeType.EOF;
      break;
    } else if (l.consume("(")) {
      yield LexemeType.LParen;
    } else if (l.consume(")")) {
      yield LexemeType.RParen;
    } else if (l.consume(";")) {
      return lexComment;
    } else if (l.match(Sentinels.NUMBER_START)) {
      return lexNumber;
    } else if (l.match(Sentinels.STRING_START)) {
      return lexString;
    } else if (l.consume(Sentinels.WHITESPACE)) {
      l.ignore();
    } else if (l.match(Sentinels.IDENTIFIER_START)) {
      return lexIdentifier;
    } else {
      l.error(`unexpected ${l.current()}`);
      break;
    }
  }
  return null;
};

export function lex(blob: string): Lexeme[] {
  const l = new Lexer(blob);
  return Array.from(l.run(lexDefault));
}
