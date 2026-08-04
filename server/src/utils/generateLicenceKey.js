import { randomInt } from "crypto"

// Same alphabet as the customer's user ID: no 0/O or 1/I/L, because these keys
// get read aloud to support and copied off screenshots.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
const GROUPS = 3
const GROUP_LENGTH = 4
const PREFIX = "RSW"

export const LICENCE_KEY_PATTERN = new RegExp(
  `^${PREFIX}(-[${ALPHABET}]{${GROUP_LENGTH}}){${GROUPS}}$`
)

// e.g. RSW-8F3K-2MQP-XZ47 — 31^12 combinations, so a key cannot be guessed.
export function generateLicenceKey() {
  const groups = []
  for (let g = 0; g < GROUPS; g++) {
    let group = ""
    for (let i = 0; i < GROUP_LENGTH; i++) group += ALPHABET[randomInt(ALPHABET.length)]
    groups.push(group)
  }
  return `${PREFIX}-${groups.join("-")}`
}
