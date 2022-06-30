export enum LexemeType {
  LParen = "LParen",
  RParen = "RParen",
  Number = "Number",
  String = "String",
  Identifier = "Identifier",
  EOF = "EOF",
  Comment = "Comment",
  HTMLComment = "HTMLComment",
  Backtick = "Backtick",
  Comma = "Comma",
  SingleQuote = "SingleQuote",
}

export type LexemeValue = string | null;

export interface Lexeme {
  type: LexemeType;
  value: LexemeValue;
}

export function lexeme(type: LexemeType, value: LexemeValue): Lexeme {
  return {
    type,
    value,
  };
}

type StateFunction =
  | ((l: Lexer) => Generator<Lexeme | LexemeType, StateFunction, undefined>)
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
    if (this.cursor <= 0) {
      throw new Error("cannot backup before the start of the blob");
    }
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

  width() {
    return this.cursor - this.start;
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
        const { value: lexemeOrType } = item;

        if ((<Lexeme>lexemeOrType).value !== undefined) {
          yield lexemeOrType as Lexeme;
        } else {
          // Emit this node and move the cursor.
          yield this.emit(<LexemeType>lexemeOrType);
        }

        item = emitter.next();
      }
      stateFn = item.value;
    }
  }

  assert(pattern: string, message = "") {
    if (!this.accept(pattern)) {
      const prettyPattern = pattern
        .replaceAll("\n", "\\n")
        .replaceAll("\r", "\\r")
        .replaceAll("\t", "\\t");
      this.error(message || `expected one of >>>${prettyPattern}<<<`);
    }
  }

  error(message: string) {
    const relevant = this.blob.slice(this.start, this.cursor);
    throw new Error(`${message} at >>>${relevant}<<<`);
  }
}

const ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGIT = "0123456789";
const WHITESPACE = " \t\n\r";
const HEX_DIGIT = "0123456789abcdefABCDEF";
const BIN_DIGIT = "01";
const SEPARATOR = `()${WHITESPACE}[];`;

const expectSeparator = (l: Lexer) => {
  if (!l.eof()) {
    l.assert(SEPARATOR);
    l.backup();
  }
};

const NUMBER_START_NONDIGIT = `+\-#`;
const NUMBER_START = `${NUMBER_START_NONDIGIT}${DIGIT}`;
/**
 * Lex out a number.
 * Valid numbers are:
 * - decimal numbers (e.g. `1`, `1.2`, `-1.2`)
 * - hexadecimal numbers (e.g. `#xfF1`, `-#x035a`)
 * - binary numbers (e.g. `#b101`)
 */
const lexNumber: StateFunction = function* (l: Lexer) {
  let digits = DIGIT;
  l.accept("+-");
  if (l.accept("#")) {
    if (l.accept("x")) {
      digits = HEX_DIGIT;
    } else if (l.accept("b")) {
      digits = BIN_DIGIT;
    }
  }
  l.accept(digits);

  // Allow underscores after the first digit has been accepted.
  digits += "_";
  l.acceptRun(digits);

  if (l.accept(".")) {
    l.assert(digits);
  }
  l.acceptRun(digits);
  l.backup();
  if (l.next() === "_") {
    l.error("no underscores allowed at the end of a number");
  }

  // Disambiguate numbers and identifiers.
  // + and - are identifiers on their own.
  if (l.width() === 1) {
    l.backup();
    if (l.accept("+-")) {
      l.backup();
      return lexIdentifier;
    }
    l.next();
  }

  // A number needs to be followed by an unambiguous separator.
  // If this were not the case, 12345abcd would be parsed as a
  // number followed by an identifier.
  expectSeparator(l);

  yield LexemeType.Number;
  return lexDefault;
};

const IDENTIFIER_ILLEGAL = `()",'\`;#|\\${WHITESPACE}`;
const lexIdentifier: StateFunction = function* (l: Lexer) {
  while (!IDENTIFIER_ILLEGAL.includes(l.next()));
  l.backup();
  expectSeparator(l);
  yield LexemeType.Identifier;
  return lexDefault;
};

const STRING_START = `"\``;
const lexString: StateFunction = function* (l: Lexer) {
  const quoteType = l.next()!;
  while (!l.eof()) {
    if (l.accept("\\")) {
      l.next();
      continue;
    }
    if (l.accept(quoteType)) {
      yield LexemeType.String;
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
    yield LexemeType.HTMLComment;
  } else {
    yield LexemeType.Comment;
  }
  return lexDefault;
};

const lexModifier: StateFunction = function* (l: Lexer) {
  const curr = l.next();
  const next = l.peek();
  if (IDENTIFIER_ILLEGAL.includes(next) && next !== "(") {
    l.error(`${curr} cannot be followed by ${next}`);
  }
  switch (curr) {
    case "'":
      yield LexemeType.SingleQuote;
      break;
    case ",":
      yield LexemeType.Comma;
      break;
    case "`":
      yield LexemeType.Backtick;
      break;
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
    } else if (curr == "'" || curr == "`" || curr == ",") {
      l.backup();
      return lexModifier;
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
    } else {
      l.backup();
      return lexIdentifier;
    }
  }
  return null;
};

export function lex(blob: string): Lexeme[] {
  const l = new Lexer(blob);
  return Array.from(l.run(lexDefault));
}
