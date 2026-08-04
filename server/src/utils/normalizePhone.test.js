import test from "node:test"
import assert from "node:assert/strict"
import { normalizePhone } from "./normalizePhone.js"

test("keeps a plain 10-digit number", () => {
  assert.equal(normalizePhone("9876543210"), "9876543210")
})

test("strips spaces, dashes and brackets", () => {
  assert.equal(normalizePhone("98765-43210"), "9876543210")
  assert.equal(normalizePhone("98765 43210"), "9876543210")
  assert.equal(normalizePhone("(98765) 43210"), "9876543210")
})

test("strips a +91 country code", () => {
  assert.equal(normalizePhone("+919876543210"), "9876543210")
  assert.equal(normalizePhone("+91 98765 43210"), "9876543210")
  assert.equal(normalizePhone("919876543210"), "9876543210")
})

test("strips a leading zero", () => {
  assert.equal(normalizePhone("09876543210"), "9876543210")
})

test("rejects numbers that are too short or too long", () => {
  assert.equal(normalizePhone("98765"), null)
  assert.equal(normalizePhone("98765432109876"), null)
})

test("rejects empty and non-string input", () => {
  assert.equal(normalizePhone(""), null)
  assert.equal(normalizePhone(null), null)
  assert.equal(normalizePhone(undefined), null)
  assert.equal(normalizePhone(1234567890), null)
})

test("rejects a 10-digit number that cannot start an Indian mobile", () => {
  // Indian mobile numbers start 6-9. A 10-digit string starting 0-5 is not one.
  assert.equal(normalizePhone("1234567890"), null)
})
