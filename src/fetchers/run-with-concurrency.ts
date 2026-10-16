/**
 * Run tasks with at most `limit` in flight; results come back in task order.
 * Tasks unfinished at `deadline` (epoch ms) settle as rejected with Error('deadline').
 */
export const runWithConcurrency = async <T>(
  tasks: readonly (() => Promise<T>)[],
  limit: number,
  deadline?: number
): Promise<PromiseSettledResult<T>[]> => {
  const results: (PromiseSettledResult<T> | undefined)[] = tasks.map(() => undefined)
  let next = 0
  let expired = false
  const worker = async () => {
    while (!expired && next < tasks.length) {
      const index = next++
      const task = tasks[index]
      if (task == null) {
        return
      }
      try {
        results[index] = { status: 'fulfilled', value: await task() }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }
  const workers = Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  let timer: ReturnType<typeof setTimeout> | undefined
  const expiry =
    deadline == null
      ? null
      : new Promise<void>((resolve) => {
          timer = setTimeout(resolve, Math.max(0, deadline - Date.now()))
        })
  await (expiry == null ? workers : Promise.race([workers, expiry]))
  clearTimeout(timer)
  expired = true
  // Copy, so a task finishing after the deadline can't change the returned results.
  return results.map(
    (result): PromiseSettledResult<T> =>
      result ?? { status: 'rejected', reason: new Error('deadline') }
  )
}
