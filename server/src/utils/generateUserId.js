import { randomInt } from "crypto"

// Customers read this ID aloud to support and copy it off screenshots, so the
// alphabet drops every character that is ambiguous in that setting:
// 0/O, 1/I/L. 31 usable characters ^ 6 places is ~887 million combinations.
export const USER_ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
const ID_LENGTH = 6
const PREFIX = "RSW-"

export const USER_ID_PATTERN = new RegExp(`^${PREFIX}[${USER_ID_ALPHABET}]{${ID_LENGTH}}$`)

export function generateUserId() {
  let body = ""
  for (let i = 0; i < ID_LENGTH; i++) {
    body += USER_ID_ALPHABET[randomInt(USER_ID_ALPHABET.length)]
  }
  return PREFIX + body
}
