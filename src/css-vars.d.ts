import 'react'

// Custom properties set through `style`; the heatmap's track sizes read `--weeks`.
declare module 'react' {
  interface CSSProperties {
    '--weeks'?: number
  }
}
