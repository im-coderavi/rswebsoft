// Brand/social glyphs as inline SVG (lucide removed brand logos for trademark reasons).
const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
}

export function Facebook(props) {
  return (
    <svg {...base} {...props}>
      <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5H17V4.6c-.3 0-1.3-.1-2.45-.1-2.42 0-4.05 1.48-4.05 4.18v2.32H7.7V14h2.8v8z" />
    </svg>
  )
}

export function Twitter(props) {
  return (
    <svg {...base} {...props}>
      <path d="M17.3 3h3.3l-7.2 8.24L21.8 21h-6.6l-5.18-6.77L4.1 21H.8l7.7-8.8L2 3h6.77l4.68 6.19zm-1.16 16h1.83L7.03 4.9H5.07z" />
    </svg>
  )
}

export function Linkedin(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0M3.2 8.5h3.5V21H3.2zM9.5 8.5h3.35v1.7h.05c.47-.88 1.6-1.8 3.3-1.8 3.53 0 4.18 2.32 4.18 5.35V21h-3.5v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21H9.5z" />
    </svg>
  )
}

export function Youtube(props) {
  return (
    <svg {...base} {...props}>
      <path d="M23 12s0-3.2-.4-4.73a2.47 2.47 0 0 0-1.74-1.75C19.32 5.1 12 5.1 12 5.1s-7.32 0-8.86.42A2.47 2.47 0 0 0 1.4 7.27C1 8.8 1 12 1 12s0 3.2.4 4.73a2.47 2.47 0 0 0 1.74 1.75c1.54.42 8.86.42 8.86.42s7.32 0 8.86-.42a2.47 2.47 0 0 0 1.74-1.75C23 15.2 23 12 23 12M9.75 15.02V8.98L15.5 12z" />
    </svg>
  )
}
