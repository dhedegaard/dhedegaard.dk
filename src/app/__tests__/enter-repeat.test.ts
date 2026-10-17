import { describe, expect, it } from 'vitest'
import { guardEnterRepeat } from '../enter-repeat'

const latest = new EventTarget()
const older = new EventTarget()

describe('guardEnterRepeat', () => {
  it('records the button a fresh Enter press starts on', () => {
    expect(guardEnterRepeat({ key: 'Enter', repeat: false, currentTarget: latest }, older)).toEqual(
      { pressedOn: latest, block: false }
    )
  })

  it('lets a held Enter keep pressing its own button', () => {
    expect(guardEnterRepeat({ key: 'Enter', repeat: true, currentTarget: older }, older)).toEqual({
      pressedOn: older,
      block: false,
    })
  })

  it('blocks a held Enter on a button that focus moved to', () => {
    expect(guardEnterRepeat({ key: 'Enter', repeat: true, currentTarget: older }, latest)).toEqual({
      pressedOn: latest,
      block: true,
    })
  })

  it('blocks a held Enter that started outside the controls', () => {
    expect(guardEnterRepeat({ key: 'Enter', repeat: true, currentTarget: older }, null)).toEqual({
      pressedOn: null,
      block: true,
    })
  })

  it('ignores other keys, so a held Tab still moves focus', () => {
    expect(guardEnterRepeat({ key: 'Tab', repeat: true, currentTarget: older }, latest)).toEqual({
      pressedOn: latest,
      block: false,
    })
  })
})
