import * as z from 'zod/mini'

/** The `?years=N` param, both ways: a canonical whole-number string ↔ a window index from 1 to `maxYears`. */
export const yearsParam = (maxYears: number) =>
  z.codec(z.string().check(z.regex(/^[1-9]\d*$/)), z.int().check(z.gte(1), z.lte(maxYears)), {
    decode: (value) => Number(value),
    encode: (years) => String(years),
  })
