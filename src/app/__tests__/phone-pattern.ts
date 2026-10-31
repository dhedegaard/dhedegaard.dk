// 8 digits as 8, 4+4 or four pairs (space, dash or dot), optionally after +45; word-bounded so hashes don't match.
export const PHONE_PATTERN =
  /(?<!\w)(?:\+45[\s.-]?)?(?:\d{8}|\d{4}[\s.-]\d{4}|\d{2}(?:[\s.-]\d{2}){3})(?!\w)/
