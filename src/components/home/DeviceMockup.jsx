import { toneGradient } from "../../lib/tones"

/* A single "product" card inside the laptop dashboard. */
function DashCard({ tone }) {
  return (
    <div className="rounded-md bg-ink-800 p-1.5 ring-1 ring-white/5">
      <div className="mb-1.5 h-7 rounded" style={toneGradient(tone, 140)} />
      <div className="h-1.5 w-4/5 rounded-full bg-ink-600" />
      <div className="mt-1 flex items-center justify-between">
        <div className="h-1.5 w-6 rounded-full bg-brand-500/80" />
        <div className="h-1.5 w-4 rounded-full bg-ink-600" />
      </div>
    </div>
  )
}

/* A photo-style card inside the phone app. */
function PhoneCard({ tone }) {
  return (
    <div className="overflow-hidden rounded-md bg-ink-800 ring-1 ring-white/5">
      <div className="h-8" style={toneGradient(tone, 150)} />
      <div className="space-y-1 p-1">
        <div className="h-1 w-3/4 rounded-full bg-ink-600" />
        <div className="h-1 w-1/2 rounded-full bg-ink-700" />
      </div>
    </div>
  )
}

// Realistic laptop (admin dashboard) + phone (app) mock-up, pure CSS/JSX.
export default function DeviceMockup() {
  const dashTones = ["violet", "sky", "pink", "emerald", "amber", "indigo"]
  const phoneTones = ["pink", "sky", "amber", "emerald"]

  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      {/* ---- LAPTOP ---- */}
      <div className="relative">
        {/* lid / screen frame */}
        <div className="rounded-[14px] bg-gradient-to-b from-ink-600 to-ink-800 p-[6px] shadow-2xl glow-shadow">
          <div className="relative overflow-hidden rounded-[9px] bg-ink-950 ring-1 ring-black/40">
            {/* screen glass reflection */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/8 via-transparent to-transparent" />

            {/* dashboard UI */}
            <div className="flex h-[248px] text-[0px]">
              {/* sidebar */}
              <div className="flex w-9 flex-col items-center gap-2 border-r border-white/5 bg-ink-900 py-2.5">
                <div className="mb-1 h-4 w-4 rounded-md bg-brand-gradient" />
                {["bg-brand-500/80", "bg-ink-600", "bg-ink-600", "bg-ink-600", "bg-ink-600"].map((c, i) => (
                  <div key={i} className={`h-2.5 w-2.5 rounded ${c}`} />
                ))}
                <div className="mt-auto h-3 w-3 rounded-full bg-ink-700" />
              </div>

              {/* main */}
              <div className="flex-1">
                {/* top bar */}
                <div className="flex items-center gap-2 border-b border-white/5 bg-ink-900/60 px-2.5 py-2">
                  <div className="h-3 w-3 rounded bg-ink-600" />
                  <div className="h-3 flex-1 rounded-full bg-ink-800 ring-1 ring-white/5" />
                  <div className="h-3 w-3 rounded-full bg-ink-600" />
                  <div className="h-4 w-4 rounded-full bg-brand-gradient" />
                </div>

                {/* content */}
                <div className="p-2.5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="h-2.5 w-16 rounded-full bg-cloud-500/50" />
                    <div className="h-3 w-10 rounded-md bg-brand-gradient" />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {dashTones.map((t, i) => (
                      <DashCard key={i} tone={t} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* hinge + base */}
        <div className="relative mx-auto -mt-px h-[10px] w-[112%] -translate-x-[5.3%] rounded-b-[6px] bg-gradient-to-b from-ink-600 to-ink-750 [clip-path:polygon(3%_0,97%_0,100%_100%,0_100%)]">
          {/* trackpad notch */}
          <div className="mx-auto h-[3px] w-10 rounded-b-md bg-ink-900/80" />
        </div>
        <div className="mx-auto h-[3px] w-[118%] -translate-x-[7.6%] rounded-b-full bg-black/40 blur-[1px]" />
      </div>

      {/* ---- PHONE ---- */}
      <div className="absolute -bottom-8 -right-1 w-[104px] rounded-[1.4rem] bg-gradient-to-b from-ink-600 to-ink-800 p-[4px] shadow-2xl sm:w-[116px]">
        <div className="relative overflow-hidden rounded-[1.15rem] bg-ink-950 ring-1 ring-black/40">
          {/* dynamic island */}
          <div className="absolute left-1/2 top-1.5 z-10 h-2.5 w-9 -translate-x-1/2 rounded-full bg-black" />
          {/* screen reflection */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/8 via-transparent to-transparent" />

          <div className="px-2 pb-2 pt-5">
            {/* app header */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-brand-gradient" />
                <div className="h-1.5 w-8 rounded-full bg-ink-600" />
              </div>
              <div className="h-2.5 w-2.5 rounded bg-ink-600" />
            </div>
            {/* promo banner */}
            <div className="mb-2 h-9 rounded-lg bg-brand-gradient p-1.5">
              <div className="h-1.5 w-3/5 rounded-full bg-white/70" />
              <div className="mt-1 h-1 w-2/5 rounded-full bg-white/40" />
            </div>
            {/* search */}
            <div className="mb-2 h-3 rounded-full bg-ink-800 ring-1 ring-white/5" />
            {/* photo grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {phoneTones.map((t, i) => (
                <PhoneCard key={i} tone={t} />
              ))}
            </div>
          </div>

          {/* bottom tab bar */}
          <div className="flex items-center justify-around border-t border-white/5 bg-ink-900/80 py-1.5">
            {["bg-brand-500", "bg-ink-600", "bg-ink-600", "bg-ink-600"].map((c, i) => (
              <div key={i} className={`h-2 w-2 rounded ${c}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
