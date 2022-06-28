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

  matches(ch: string, pattern: string | RegExp) {
    return (
      (pattern instanceof RegExp && pattern.test(ch)) ||
      (typeof pattern === "string" && pattern.includes(ch))
    );
  }

  accept(pattern: string | RegExp) {
    const ch = this.next();
    if (this.matches(ch, pattern)) {
      return true;
    }
    this.backup();
    return false;
  }

  acceptRun(pattern: string | RegExp) {
    while (this.matches(this.next(), pattern));
    this.backup();
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

  assert(pattern: string | RegExp) {
    if (!this.accept(pattern)) {
      this.error(`expected ${pattern.toString()}`);
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
  l.accept("+-");
  if (l.accept("0") && l.accept("x")) {
    digits = "123456789abcdef";
  }
  l.accept(digits);

  // Allow underscores after the first digit has been acceptd.
  digits += "_";
  l.acceptRun(digits);

  if (l.accept(".")) {
    l.assert(digits);
  }
  l.acceptRun(digits);

  yield LexemeType.Number;
  return lexDefault;
};

const lexIdentifier: StateFunction = function* (l: Lexer) {
  l.accept(Sentinels.IDENTIFIER_START);
  l.acceptRun(/[_a-zA-Z0-9,:\-]/);
  yield LexemeType.Identifier;
  return lexDefault;
};

const lexString: StateFunction = function* (l: Lexer) {
  const quoteType = l.next();
  while (true) {
    l.acceptRun(new RegExp(`[^${quoteType}\\]`));
    if (l.accept(quoteType)) {
      break;
    }
    if (l.accept("\\")) {
      l.next();
    }
  }
  yield LexemeType.String;
  return lexDefault;
};

const lexComment: StateFunction = function* (l: Lexer) {
  l.accept(";");
  let html = false;
  if (l.accept(";")) {
    html = true;
  }

  while (!l.eof()) {
    if (!l.accept(/[^\n]/)) {
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
    const curr = l.next();
    if (curr === Lexer.EOF) {
      yield LexemeType.EOF;
      break;
    } else if (curr == "(") {
      yield LexemeType.LParen;
    } else if (curr == ")") {
      yield LexemeType.RParen;
    } else if (curr == ";") {
      return lexComment;
    } else if (l.matches(curr, Sentinels.NUMBER_START)) {
      return lexNumber;
    } else if (l.matches(curr, Sentinels.STRING_START)) {
      return lexString;
    } else if (l.matches(curr, Sentinels.WHITESPACE)) {
      l.ignore();
    } else if (l.matches(curr, Sentinels.IDENTIFIER_START)) {
      return lexIdentifier;
    } else {
      l.error(`unexpected ${curr}`);
      break;
    }
  }
  return null;
};

export function lex(blob: string): Lexeme[] {
  const l = new Lexer(blob);
  return Array.from(l.run(lexDefault));
}
