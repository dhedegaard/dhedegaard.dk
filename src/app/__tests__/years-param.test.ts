import { describe, expect, it } from 'vitest'
import * as z from 'zod/mini'
import { yearsParam } from '../years-param'

describe('yearsParam', () => {
  it('decodes whole numbers from 1 to the oldest window', () => {
    expect(z.safeDecode(yearsParam(15), '1')).toMatchObject({ success: true, data: 1 })
    expect(z.safeDecode(yearsParam(15), '15')).toMatchObject({ success: true, data: 15 })
  })

  it.each(['', '0', '-1', '1.5', '1e0', ' 1', '01', 'abc', '16'])('rejects %j', (value) => {
    expect(z.safeDecode(yearsParam(15), value).success).toBe(false)
  })

  it('rejects everything when there is only one window', () => {
    expect(z.safeDecode(yearsParam(0), '1').success).toBe(false)
  })

  it('encodes back to the param string', () => {
    expect(z.encode(yearsParam(15), 4)).toBe('4')
  })

  it('refuses to encode a window past the oldest', () => {
    expect(z.safeEncode(yearsParam(15), 16).success).toBe(false)
  })
})
