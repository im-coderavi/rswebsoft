// Product/brand copy sometimes gets pasted in from rich-text sources (AI
// chat exports, Word, CMS editors) carrying raw HTML tags, HTML entities, or
// literal "\n" escape sequences instead of real line breaks. Every place that
// renders free-text copy should pass it through here first so stray markup
// never reaches the DOM as visible text.
//
// Use for single-line copy (names, tags, short descriptions, feature bullets)
// — collapses everything to one line.
export function cleanText(input) {
  if (!input) return ""
  return String(input)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\\r\\n|\\n|\\r/g, " ")
    .replace(/\r\n|\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Use for multi-paragraph copy (full product descriptions) — strips markup
// but keeps paragraph breaks so `whitespace-pre-line` still reads correctly.
export function cleanRichText(input) {
  if (!input) return ""
  return String(input)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
