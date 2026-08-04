// Every customer-facing link in an email is built from CLIENT_URL. If it is
// wrong, the emails still send and still look fine — they just point somewhere
// the customer can't reach, and nobody finds out until someone complains.
//
// This shipped to production set to http://localhost:5173, which meant the
// welcome, delivery and password-reset links all pointed at the recipient's
// own machine. Password reset in particular was completely unusable.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]

export function isLocalUrl(url) {
  try {
    return LOCAL_HOSTS.includes(new URL(url).hostname)
  } catch {
    return false
  }
}

export function clientUrl() {
  return (process.env.CLIENT_URL || "").replace(/\/$/, "")
}

// Called once at boot. Turns a silent broken-links bug into something visible
// in the deployment logs.
export function warnIfClientUrlLooksWrong() {
  const url = clientUrl()
  const inProduction = process.env.NODE_ENV === "production"

  if (!url) {
    console.error(
      "[config] CLIENT_URL is not set. Links in welcome, delivery and password-reset emails will be broken."
    )
    return
  }

  if (inProduction && isLocalUrl(url)) {
    console.error(
      `[config] CLIENT_URL is "${url}" while NODE_ENV=production. Every email link will point at the customer's own machine — password reset will not work at all. Set CLIENT_URL to the public site address.`
    )
  }
}
