import { readFile } from "fs/promises"

// Replaces every {{key}} in the template file with data[key] (or "" if missing).
export async function renderTemplate(templatePath, data) {
  const raw = await readFile(templatePath, "utf-8")
  return raw.replace(/{{\s*(\w+)\s*}}/g, (_, key) => (data[key] != null ? String(data[key]) : ""))
}
