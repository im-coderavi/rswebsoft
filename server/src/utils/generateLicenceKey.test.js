import test from "node:test"
import assert from "node:assert/strict"
import { generateLicenceKey, LICENCE_KEY_PATTERN } from "./generateLicenceKey.js"

test("matches the RSW-XXXX-XXXX-XXXX shape", () => {
  assert.match(generateLicenceKey(), /^RSW-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
})

test("never emits an ambiguous character", () => {
  for (let i = 0; i < 500; i++) {
    const body = generateLicenceKey().slice(4)
    for (const char of ["0", "1", "O", "I", "L"]) {
      assert.equal(body.includes(char), false, `key contained ${char}: ${body}`)
    }
  }
})

test("LICENCE_KEY_PATTERN accepts generated keys and rejects near-misses", () => {
  assert.match(generateLicenceKey(), LICENCE_KEY_PATTERN)
  assert.doesNotMatch("RSW-8F3K-2MQP", LICENCE_KEY_PATTERN) // one group short
  assert.doesNotMatch("RSW-8F3K-2MQP-XZ4", LICENCE_KEY_PATTERN) // short group
  assert.doesNotMatch("RSW-8F3K-2MQP-XZ4O", LICENCE_KEY_PATTERN) // ambiguous char
  assert.doesNotMatch("rsw-8f3k-2mqp-xz47", LICENCE_KEY_PATTERN) // lowercase
  assert.doesNotMatch("8F3K-2MQP-XZ47", LICENCE_KEY_PATTERN) // no prefix
})

test("does not collide across a large sample", () => {
  const seen = new Set()
  for (let i = 0; i < 5000; i++) seen.add(generateLicenceKey())
  assert.equal(seen.size, 5000)
})
