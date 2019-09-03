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

export interface Entry {
  name: string;
  url: string;
  repo: string;
  raw: RawEntry;
}
export type RawEntry =
  | { type: "url"; url: string; repo: string }
  | { type: "github"; owner: string; name: string };
