import { afterEach, describe, expect, it, vi } from 'vitest'
import { runWithConcurrency } from '../run-with-concurrency'

afterEach(() => {
  vi.useRealTimers()
})

const after = <T>(ms: number, value: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => {
      resolve(value)
    }, ms)
  })

describe('runWithConcurrency', () => {
  it('never runs more than the limit at once', async () => {
    let running = 0
    let most = 0
    const task = async () => {
      running++
      most = Math.max(most, running)
      await Promise.resolve()
      await Promise.resolve()
      running--
      return most
    }

    await runWithConcurrency(
      Array.from({ length: 5 }, () => task),
      2
    )

    expect(most).toBe(2)
  })

  it('returns settled results in task order', async () => {
    const results = await runWithConcurrency(
      [
        () => Promise.resolve('a'),
        () => Promise.reject(new Error('b')),
        () => Promise.resolve('c'),
      ],
      2
    )

    expect(results).toEqual([
      { status: 'fulfilled', value: 'a' },
      { status: 'rejected', reason: new Error('b') },
      { status: 'fulfilled', value: 'c' },
    ])
  })

  it('settles a synchronously throwing task as rejected', async () => {
    const results = await runWithConcurrency(
      [
        () => {
          throw new Error('sync')
        },
      ],
      1
    )

    expect(results).toEqual([{ status: 'rejected', reason: new Error('sync') }])
  })

  it('rejects tasks not finished before the deadline', async () => {
    vi.useFakeTimers()
    const result = runWithConcurrency(
      [() => after(100, 'a'), () => after(100, 'b'), () => after(100, 'c')],
      1,
      Date.now() + 150
    )
    await vi.advanceTimersByTimeAsync(150)

    expect(await result).toEqual([
      { status: 'fulfilled', value: 'a' },
      { status: 'rejected', reason: new Error('deadline') },
      { status: 'rejected', reason: new Error('deadline') },
    ])
  })

  it('aborts the signal passed to tasks at the deadline', async () => {
    vi.useFakeTimers()
    const signals: AbortSignal[] = []
    const result = runWithConcurrency(
      [
        (signal) => {
          signals.push(signal)
          return after(100, 'a')
        },
      ],
      1,
      Date.now() + 50
    )
    await vi.advanceTimersByTimeAsync(50)
    await result

    expect(signals[0]?.aborted).toBe(true)
    expect(signals[0]?.reason).toEqual(new Error('deadline'))
  })
})
