const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

// Escapes &, <, >, ", ' to their HTML entities so user-controlled scalar
// values can be safely interpolated into email HTML templates.
export function escapeHtml(str) {
  if (str == null) return ""
  return String(str).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch])
}
