// 8 digits, or four spaced/dashed pairs, optionally after +45; word-bounded so hashes don't match.
export const PHONE_PATTERN = /(?<!\w)(?:\+45[\s-]?)?(?:\d{8}|\d{2}(?:[\s-]\d{2}){3})(?!\w)/
