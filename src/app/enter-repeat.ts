interface EnterKeyDown {
  key: string
  repeat: boolean
  currentTarget: EventTarget
}
interface EnterRepeatGuard {
  pressedOn: EventTarget | null
  block: boolean
}

/** A held Enter keeps pressing its own button, but not one that focus moved to. */
export const guardEnterRepeat = (
  event: EnterKeyDown,
  pressedOn: EventTarget | null
): EnterRepeatGuard => {
  if (event.key !== 'Enter') {
    return { pressedOn, block: false }
  }
  if (!event.repeat) {
    return { pressedOn: event.currentTarget, block: false }
  }
  return { pressedOn, block: event.currentTarget !== pressedOn }
}
