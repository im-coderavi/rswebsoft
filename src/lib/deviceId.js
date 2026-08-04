const STORAGE_KEY = "rs_device"

// A stable id for this browser, minted once and kept in localStorage. It is
// what the licence device gate counts, so a buyer's phone and laptop register
// as two machines and a third has to be approved by the shop.
//
// This is not tamper-proof — someone determined can copy the value between
// machines. It is paired server-side with the address and user agent of every
// use, which is what lets the admin see when that has happened.
export function getDeviceId() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing

    const id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    // Private mode or blocked site data. Returning null makes the server ask
    // the customer to enable storage rather than silently minting a new
    // device on every single request.
    return null
  }
}
