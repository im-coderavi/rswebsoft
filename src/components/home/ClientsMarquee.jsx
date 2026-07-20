import { useState } from "react"

const CLIENTS = [
  { name: "WeftKart", logo: "/brand-logos/weftkart.svg", website: "https://weftkart.com/" },
  { name: "BUYON", logo: "/brand-logos/buyon.svg", website: "https://buyon.in/" },
  { name: "ONOFFER", logo: "/brand-logos/onoffer.svg", website: "https://onoffer.in/" },
  { name: "Vassio", logo: "/brand-logos/vassio.svg", website: "https://vassio.in/" },
  { name: "H&MSHOES", logo: "/brand-logos/hmshoes.svg", website: "https://hmshoes.in/" },
  { name: "okmart", logo: "/brand-logos/okmart.svg", website: "https://okmart.co.in/" },
  { name: "Zest Shop", logo: "/brand-logos/zestshop.svg", website: "https://zestshop.in/" },
  { name: "STYLOKICKS", logo: "/brand-logos/stylokicks.svg", website: "https://stylokicks.in/" },
  { name: "ShoeszoN", logo: "/brand-logos/shoeszon.svg", website: "https://shoeszon.in/" },
  { name: "WatchesWorld", logo: "/brand-logos/watchesworld.svg", website: "https://watchesworld.in/" },
  { name: "BrandsWorld", logo: "/brand-logos/brandsworld.svg", website: "https://brandsworld.in/" }
]

function ClientCard({ client }) {
  return (
    <a
      href={client.website}
      target="_blank"
      rel="noreferrer"
      className="group flex h-16 w-[180px] shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-white px-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-md hover:shadow-black/5 sm:h-20 sm:w-[220px]"
    >
      <img
        src={client.logo}
        alt={client.name}
        draggable={false}
        className="h-8 max-w-full object-contain transition duration-300 group-hover:scale-105 sm:h-10"
      />
    </a>
  )
}

function MarqueeTrack({ list }) {
  const [paused, setPaused] = useState(false)

  // Duplicate items for a smooth infinite scroll
  let track = [...list]
  while (track.length > 0 && track.length < 24) {
    track = [...track, ...list]
  }

  const duration = track.length * 2.2

  return (
    <div
      className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        className="brands-marquee-track flex w-max gap-3 py-2 sm:gap-4"
        style={{ animationDuration: `${duration}s`, animationPlayState: paused ? "paused" : "running" }}
      >
        {track.map((client, i) => (
          <ClientCard key={`${client.name}-${i}`} client={client} />
        ))}
      </div>
    </div>
  )
}

export default function ClientsMarquee() {
  return (
    <section id="clients-marquee" className="scroll-mt-32 py-12 sm:py-16 bg-ink-900/20">
      <div className="container-rs text-center mb-8 sm:mb-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-cloud-100 sm:text-3xl lg:text-4xl">
          Trusted by{" "}
          <span className="relative inline-block text-emerald-500 dark:text-emerald-400">
            350+ Clients
            <span className="absolute left-0 bottom-0.5 h-[3px] w-full rounded bg-emerald-500" />
          </span>{" "}
          Worldwide
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-xs font-medium text-cloud-400 sm:text-sm md:text-base">
          Building High-Impact Websites &amp; Tailored Solutions That Drive Business Growth
        </p>
      </div>

      <div className="container-rs">
        <MarqueeTrack list={CLIENTS} />
      </div>
    </section>
  )
}
