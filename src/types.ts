interface TokenBase {
  start: number;
  content: string;
}

export interface SafeToken extends TokenBase {
  safe: true;
}
export interface UnsafeToken extends TokenBase {
  safe: false;
}

export type Token = SafeToken | UnsafeToken;

export interface Replacement {
  start: number;
  end: number;
  with: Token[];
}
