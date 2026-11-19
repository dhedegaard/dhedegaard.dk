import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ErrorMessage, type RouteError } from '../error-message'

const render = (error: RouteError) =>
  renderToStaticMarkup(
    <ErrorMessage error={error}>
      <button>Retry</button>
    </ErrorMessage>
  )

describe('ErrorMessage', () => {
  it('shows the error, its reference and the retry control', () => {
    const error: RouteError = Object.assign(new Error('boom'), { digest: 'abc123' })
    const markup = render(error)

    expect(markup).toContain('500: Internal Server Error')
    expect(markup).toContain('Error: boom')
    expect(markup).toContain('Reference: abc123')
    expect(markup).toContain('<button>Retry</button>')
  })

  it('leaves out the reference without a digest', () => {
    expect(render(new Error('boom'))).not.toContain('Reference')
  })
})
