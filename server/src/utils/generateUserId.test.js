import test from "node:test"
import assert from "node:assert/strict"
import { generateUserId, USER_ID_ALPHABET, USER_ID_PATTERN } from "./generateUserId.js"

test("matches the RSW-XXXXXX shape", () => {
  assert.match(generateUserId(), /^RSW-[A-Z0-9]{6}$/)
})

test("excludes ambiguous characters from the alphabet", () => {
  for (const char of ["0", "1", "O", "I", "L"]) {
    assert.equal(USER_ID_ALPHABET.includes(char), false, `alphabet must not contain ${char}`)
  }
  assert.equal(USER_ID_ALPHABET.length, 31)
})

test("only ever emits characters from the alphabet", () => {
  for (let i = 0; i < 500; i++) {
    const body = generateUserId().slice(4)
    for (const char of body) {
      assert.ok(USER_ID_ALPHABET.includes(char), `unexpected character ${char}`)
    }
  }
})

test("USER_ID_PATTERN accepts generated ids and rejects near-misses", () => {
  assert.match(generateUserId(), USER_ID_PATTERN)
  assert.doesNotMatch("RSW-8F3K2", USER_ID_PATTERN) // too short
  assert.doesNotMatch("RSW-8F3K2MM", USER_ID_PATTERN) // too long
  assert.doesNotMatch("RSW-8F3K2O", USER_ID_PATTERN) // ambiguous char
  assert.doesNotMatch("rsw-8F3K2M", USER_ID_PATTERN) // lowercase prefix
  assert.doesNotMatch("8F3K2M", USER_ID_PATTERN) // no prefix
})

test("stays essentially collision-free across a large sample", () => {
  const SAMPLE = 5000
  const seen = new Set()
  for (let i = 0; i < SAMPLE; i++) seen.add(generateUserId())

  // Not asserted as exactly SAMPLE on purpose. The keyspace is 31^6 ≈ 887M, so
  // by the birthday bound a run of 5000 has roughly a 1.4% chance of one
  // honest collision — a strict equality here fails about once every seventy
  // runs with nothing wrong, which just teaches people to ignore red tests.
  //
  // Anything that actually broke the generator (a constant seed, a truncated
  // alphabet, a modulo that collapses the range) would produce collisions by
  // the hundred, so this bound still catches every real failure.
  assert.ok(
    seen.size >= SAMPLE - 5,
    `expected near-total uniqueness, got ${seen.size} distinct out of ${SAMPLE}`
  )
})
