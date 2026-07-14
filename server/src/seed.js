import "dotenv/config"
import { connectDB } from "./config/db.js"
import Category from "./models/Category.js"
import Brand from "./models/Brand.js"
import Product from "./models/Product.js"
import PaymentSetting from "./models/PaymentSetting.js"
import User from "./models/User.js"
import { slugify } from "./utils/slugify.js"

// Mirrors src/data/site.js so the admin panel starts with the same catalog
// shape the storefront mock data already uses.
const categories = [
  { icon: "Wordpress", name: "WordPress Plugins", tone: "violet" },
  { icon: "Wordpress", name: "WordPress Themes", tone: "indigo" },
  { icon: "Globe", name: "Ready Websites", tone: "pink" },
  { icon: "Cloud", name: "SaaS Software", tone: "teal" },
  { icon: "Sparkles", name: "AI Tools", tone: "amber" },
  { icon: "Code2", name: "Source Codes", tone: "sky" },
  { icon: "FileCode2", name: "PHP Scripts", tone: "rose" },
  { icon: "Atom", name: "Laravel Projects", tone: "red" },
  { icon: "Boxes", name: "React Projects", tone: "cyan" },
  { icon: "Smartphone", name: "Mobile Apps", tone: "blue" },
  { icon: "LayoutTemplate", name: "Templates", tone: "orange" },
  { icon: "Package", name: "Bundles", tone: "fuchsia" },
  { icon: "Palette", name: "Graphics", tone: "pink" },
  { icon: "Megaphone", name: "Marketing Tools", tone: "rose" },
  { icon: "TrendingUp", name: "SEO Tools", tone: "emerald" },
  { icon: "FileText", name: "Documents", tone: "sky" },
  { icon: "GraduationCap", name: "Courses", tone: "lime" },
  { icon: "BookOpen", name: "eBooks", tone: "amber" },
  { icon: "Wrench", name: "Developer Tools", tone: "violet" },
]

const brands = [
  { name: "WPKartPro", tag: "WordPress Products", icon: "ShoppingCart", tone: "orange", website: "https://wpkartpro.com/", logo: { url: "/brand-logos/wpkartpro.svg", publicId: "" } },
  { name: "ToolzyPro", tag: "Software & Tools", icon: "Wrench", tone: "violet", website: "https://toolzypro.com/", logo: { url: "/brand-logos/toolzypro.svg", publicId: "" } },
  { name: "WPTemplatesHub", tag: "Ready Websites", icon: "LayoutTemplate", tone: "pink", website: "https://wptemplateshub.com/", logo: { url: "/brand-logos/wptemplateshub.svg", publicId: "" } },
  { name: "CodexBazaar", tag: "Source Codes", icon: "Code2", tone: "teal", website: "https://codexbazaar.com/", logo: { url: "/brand-logos/codexbazaar.svg", publicId: "" } },
  { name: "AppsClap", tag: "AI Tools", icon: "Sparkles", tone: "sky", website: "https://appsclap.com/", logo: { url: "/brand-logos/appsclap.svg", publicId: "" } },
  { name: "BizzProfile", tag: "Digital Business Profile", icon: "Building2", tone: "emerald", website: "https://bizzprofile.com/", logo: { url: "/brand-logos/bizzprofile.svg", publicId: "" } },
]

// Real, freely-licensed stock photos (Unsplash CDN) grouped by theme, so
// seeded products get plausible, professional-looking cover images instead
// of flat color placeholders. Each product picks one image from its theme.
const IMAGE_POOL = {
  code: ["1461749280684-dccba630e2f6", "1517180102446-f3ece451e9d8", "1498050108023-c5249f4df085", "1550439062-609e1531270e", "1517245386807-bb43f82c33c4"],
  webdesign: ["1499750310107-5fef28a66643", "1558655146-9f40138edfeb", "1626785774573-4b799315345d"],
  business: ["1521737604893-d14cc237f11d", "1600880292203-757bb62b4baf", "1552664730-d307ca884978", "1556761175-5973dc0f32e7", "1507679799987-c73779587ccf"],
  ecommerce: ["1472851294608-062f824d29cc", "1556742049-0cfed4f6a45d"],
  mobile: ["1512941937669-90a1b58e7e9c", "1556656793-08538906a9f8"],
  ai: ["1677442136019-21780ecad995", "1620712943543-bcc4688e7485"],
  realestate: ["1560518883-ce09059eeffa", "1600585154340-be6161a56a0c"],
  restaurant: ["1517248135467-4c7edcad34c4", "1555396273-367ea4eb4db5"],
  gym: ["1534438327276-14e5300c3a48", "1571019613454-1cb2f99b2d8b"],
  hospital: ["1519494026892-80bbd2d6fd0d", "1576091160399-112ba8d25d1d"],
  education: ["1524995997946-a1c2e315a42f", "1481627834876-b7833e8f5570"],
  analytics: ["1460925895917-afdab827c52f", "1551288049-bebda4e38f71"],
  security: ["1522202176988-66273c2fd55f"],
}

function stockImage(theme, seedKey) {
  const pool = IMAGE_POOL[theme] || IMAGE_POOL.code
  // deterministic pick so re-seeding is stable, not random each run
  let hash = 0
  for (const ch of seedKey) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const id = pool[hash % pool.length]
  return {
    url: `https://images.unsplash.com/photo-${id}?w=900&q=80&auto=format&fit=crop`,
    publicId: `seed/${slugify(seedKey)}`,
  }
}

function rand(min, max) {
  return Math.round(min + Math.random() * (max - min))
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Each group generates several products for its category. Every group has a
// price band + theme + optional brand, kept realistic for the Indian market.
// Every item carries a genuine long-form description + a distinct features
// checklist — not a copy-paste of the tagline — since these render directly
// on the product detail page's Description and "What's Included" sections.
const productGroups = [
  {
    category: "WordPress Plugins", type: "plugin", theme: "code", brand: "WPKartPro", priceRange: [1499, 2999],
    items: [
      {
        name: "Rank Math SEO Pro", tag: "SEO Plugin for WordPress",
        description: "Rank Math SEO Pro gives your WordPress site everything it needs to rank higher on Google without hiring an SEO agency. It analyzes every post and page in real time, scores your content against best practices, and tells you exactly what to fix — from missing alt text to thin content. Built-in schema markup, XML sitemaps, and Google Search Console integration mean you get rich snippets and indexing insights without touching a single line of code.",
        features: ["Real-time on-page SEO analysis & scoring", "Built-in schema (rich snippet) generator", "Google Search Console integration", "XML sitemap & 404 monitor", "Local SEO & WooCommerce SEO modules", "Free lifetime updates & priority support"],
      },
      {
        name: "WP Rocket", tag: "Speed Optimization Plugin",
        description: "WP Rocket turns a sluggish WordPress site into a fast one in minutes, not hours. It applies page caching, file compression, and lazy loading automatically the moment you activate it — no server config or developer needed. For sites that need more, one-click options for database cleanup, CDN integration, and preloading squeeze out every remaining millisecond, which directly helps both user experience and Core Web Vitals scores.",
        features: ["One-click page caching, no configuration needed", "CSS/JS minification & combination", "Native lazy-loading for images and iframes", "Database cleanup & optimization scheduler", "CDN & Cloudflare integration", "Compatible with all major page builders"],
      },
      {
        name: "WPForms Pro", tag: "Drag & Drop Form Builder",
        description: "WPForms Pro lets you build contact forms, surveys, quizzes, and multi-step payment forms with a simple drag-and-drop editor — no coding required. Pre-built templates cover the most common use cases, and conditional logic lets each form adapt to what a visitor actually enters. It connects directly to your favorite email marketing and payment tools so submissions flow straight into your existing workflow.",
        features: ["150+ pre-built form templates", "Drag & drop conditional logic builder", "Stripe, PayPal & Razorpay payment forms", "Multi-step forms with progress bar", "Spam protection with honeypot + reCAPTCHA", "Direct integration with Mailchimp, HubSpot & more"],
      },
      {
        name: "Elementor Pro", tag: "Visual Page Builder",
        description: "Elementor Pro is the page builder that lets you design pixel-perfect WordPress pages visually, with live drag-and-drop editing and instant preview. Beyond static pages, it unlocks dynamic theme building — headers, footers, archive pages, and single post templates — so your entire site design lives in one visual editor. Hundreds of professionally designed templates and widgets mean you're rarely starting from a blank canvas.",
        features: ["Full visual theme builder (header, footer, archives)", "300+ professional templates & 90+ widgets", "WooCommerce builder for custom shop pages", "Popup builder with trigger conditions", "Mobile-responsive editing controls", "Global fonts, colors & design system"],
      },
      {
        name: "WooCommerce", tag: "eCommerce Plugin for WordPress",
        description: "WooCommerce turns any WordPress site into a fully functioning online store. It handles products, variable pricing, inventory, shipping zones, tax rules, and checkout out of the box, and its huge extension ecosystem covers everything from subscriptions to multi-currency pricing. Because it's built directly on WordPress, you keep full content control while gaining serious storefront power.",
        features: ["Unlimited products, variations & categories", "Flexible shipping zones and tax rules", "Secure checkout with major payment gateways", "Inventory & low-stock notifications", "Coupon codes & flexible discount rules", "Thousands of compatible extensions"],
      },
      {
        name: "Slider Revolution", tag: "Responsive Slider & Carousel",
        description: "Slider Revolution is the go-to plugin for building eye-catching, animated sliders, hero sections, and full-page scroll experiences without touching code. Its visual timeline editor lets you choreograph entrance animations, parallax layers, and transitions frame by frame, while ready-made templates for agencies, portfolios, and shops get you from zero to a polished hero section in minutes.",
        features: ["Visual animation timeline editor", "200+ ready-made slider & hero templates", "Parallax and 3D layer effects", "Fully responsive with per-device controls", "WooCommerce product slider addon", "Optimized markup for fast page loads"],
      },
      {
        name: "Yoast SEO Premium", tag: "Advanced SEO Plugin",
        description: "Yoast SEO Premium builds on the world's most popular SEO plugin with features that catch issues before they hurt your rankings — automatic redirect management so you never get a 404 from a renamed URL, internal linking suggestions as you write, and a readability + SEO analysis that scores content against multiple focus keyphrases at once.",
        features: ["Multiple focus keyphrase optimization", "Automatic redirect manager (no more 404s)", "Internal linking suggestions while writing", "Social previews for Facebook & Twitter/X", "Orphaned content finder", "24/7 premium support access"],
      },
      {
        name: "Wordfence Security Pro", tag: "Firewall & Malware Scanner",
        description: "Wordfence Security Pro locks down your WordPress site with an enterprise-grade firewall that blocks malicious traffic before it ever reaches your site, backed by real-time threat intelligence updated continuously. Its malware scanner checks core files, themes, and plugins against known-good copies, flagging anything altered or infected so you can clean it up immediately instead of discovering a hack weeks later.",
        features: ["Real-time firewall with threat intelligence feed", "Malware & file-integrity scanning", "Brute-force login protection & 2FA", "Live traffic monitoring with country blocking", "Real-time IP blocklist updates", "Security incident email alerts"],
      },
    ],
  },
  {
    category: "WordPress Themes", type: "theme", theme: "webdesign", brand: "WPKartPro", priceRange: [1999, 3499],
    items: [
      {
        name: "Astra Pro", tag: "Fast Multipurpose Theme",
        description: "Astra Pro is built around one core idea: speed shouldn't be sacrificed for design flexibility. It loads in a fraction of a second even with a full page builder attached, and its modular add-on system means you only load the code you actually use. Dozens of complete site templates for agencies, shops, and blogs give you a finished-looking site before you've customized a single setting.",
        features: ["Sub-50KB frontend footprint for fast loading", "280+ ready-made starter site templates", "Full compatibility with Elementor & Gutenberg", "WooCommerce-optimized shop templates", "Custom header/footer builder", "White-label mode for agencies"],
      },
      {
        name: "WoodMart", tag: "WooCommerce Store Theme",
        description: "WoodMart is a dedicated WooCommerce theme built for stores that need to look and feel premium out of the box. Pre-built shop layouts for fashion, electronics, furniture, and more come with matching product page layouts, quick-view modals, and wishlist/compare tools already wired up — so launching a professional-looking store is a matter of picking a demo and swapping in your products.",
        features: ["40+ ready-made WooCommerce shop demos", "AJAX quick-view, wishlist & compare", "Advanced product filters & swatches", "Built-in mega menu builder", "Multi-vendor marketplace compatible", "One-click demo import"],
      },
      {
        name: "TheGem", tag: "Creative Multi-Concept Theme",
        description: "TheGem is built for designers and agencies who need a different look for every project without switching themes. Its library of full-site demos spans portfolios, restaurants, agencies, and blogs, each with its own visual language, and the included page builder lets you mix elements from any demo into something entirely your own.",
        features: ["400+ full demo websites included", "Advanced WPBakery & Elementor integration", "Custom portfolio & gallery layouts", "Blog layouts for magazines & personal sites", "Built-in shortcodes for interactive elements", "Regular design refreshes with updates"],
      },
      {
        name: "Newspaper", tag: "News & Magazine Theme",
        description: "Newspaper is purpose-built for publishers who need to manage a high volume of content without the site turning into a mess. Its layout system supports breaking news bars, trending widgets, and category-specific homepages, while a built-in ad manager handles placements without a separate plugin — ideal for sites that monetize through display advertising.",
        features: ["Dedicated breaking news & trending bars", "Built-in ad manager with placement control", "100+ homepage & category layout options", "AMP support for fast mobile pages", "Front-end content submission for guest authors", "WooCommerce support for magazine shops"],
      },
      {
        name: "Avada", tag: "Multi-Purpose Website Theme",
        description: "Avada has stayed one of the best-selling WordPress themes for years because it genuinely fits almost any project — business, shop, portfolio, or blog — thanks to its own built-in page builder (Fusion Builder) and hundreds of pre-built websites you can import in one click and reshape however you like.",
        features: ["Fusion Builder drag & drop page builder", "60+ complete pre-built websites", "Built-in portfolio & form builder", "WooCommerce shop layouts included", "Extensive theme options panel, no coding", "Regularly updated with new demos"],
      },
      {
        name: "Porto", tag: "Responsive Business Theme",
        description: "Porto is a dependable, fast-loading business and eCommerce theme with a strong focus on WooCommerce out of the box — custom product layouts, ajax cart, and a highly configurable mega menu make it a solid pick for stores that need to look established from day one, without a steep learning curve for the site owner.",
        features: ["40+ pre-built store & business layouts", "AJAX cart with side-panel checkout preview", "Highly configurable mega menu", "Built-in blog & portfolio layouts", "One-click demo content import", "Translation & RTL ready"],
      },
      {
        name: "Divi", tag: "Visual Drag & Drop Theme",
        description: "Divi pairs a theme with its own visual builder so you design directly on the live page — click any element, drag it where you want, and see the result immediately with no separate preview step. A large library of pre-made layout packs for different industries means you can start from something close to finished rather than a blank page.",
        features: ["True front-end visual drag & drop editing", "800+ pre-made layout packs", "A/B split testing built in", "Global design elements & style presets", "Full WooCommerce builder modules", "Undo history & layout revisions"],
      },
      {
        name: "Flatsome", tag: "Flexible WooCommerce Theme",
        description: "Flatsome is one of the highest-rated WooCommerce themes because it strikes a balance between flexibility and simplicity — its UX Builder lets shop owners rearrange product pages and layouts visually, while sensible defaults mean the store looks polished even before deep customization.",
        features: ["UX Builder for visual product-page editing", "Built-in AJAX search & live filtering", "Advanced product options & swatches", "Instagram feed & lookbook elements", "Multiple header & shop layout presets", "Fast, lightweight codebase"],
      },
    ],
  },
  {
    category: "Ready Websites", type: "ready-website", theme: "restaurant", brand: "WPTemplatesHub", priceRange: [3499, 4999],
    items: [
      {
        name: "Restaurant Kit", tag: "35+ Page Restaurant Website", theme: "restaurant",
        description: "A complete, ready-to-launch website for restaurants, cafes, and cloud kitchens — 35+ pages covering the full menu, online table reservations, gallery, and a blog for specials or events. Every page is already populated with realistic restaurant content and photography placeholders, so you replace text and images with your own and you're live the same day.",
        features: ["35+ pre-designed, pre-populated pages", "Online table reservation form", "Menu page with categories & pricing", "Photo gallery & Instagram feed section", "Mobile-optimized ordering call-to-action", "Google Maps location integration"],
      },
      {
        name: "School Management Site", tag: "25+ Page Education Website", theme: "education",
        description: "A ready-made website for schools, coaching institutes, and colleges, with dedicated pages for admissions, faculty profiles, academic calendar, and student/parent notices. The layout is designed to look trustworthy to parents evaluating a school online, with clear navigation to the information they're actually looking for.",
        features: ["Admissions enquiry form with auto-email", "Faculty & staff profile pages", "Academic calendar & notice board section", "Gallery for campus & event photos", "Course/program listing pages", "Mobile-friendly for parent browsing"],
      },
      {
        name: "Hospital & Clinic Kit", tag: "30+ Page Healthcare Website", theme: "hospital",
        description: "A professional, trust-building website template for hospitals, clinics, and multi-doctor practices — doctor profile pages, department listings, and an appointment request form are all pre-built, so patients can find a specialist and request a visit without picking up the phone.",
        features: ["Doctor profile & specialization pages", "Appointment request form with department routing", "Department & services listing pages", "Patient testimonials section", "Emergency contact bar on every page", "Fully responsive for mobile patients"],
      },
      {
        name: "Gym & Fitness Kit", tag: "20+ Page Fitness Website", theme: "gym",
        description: "A high-energy website template for gyms, personal trainers, and fitness studios, with pages for class schedules, trainer bios, membership pricing tables, and a transformation gallery — everything a prospective member checks before walking in the door.",
        features: ["Class schedule & timetable page", "Membership pricing table with plan comparison", "Trainer profile & specialty pages", "Before/after transformation gallery", "Free trial signup form", "Social proof & member testimonials section"],
      },
      {
        name: "Real Estate Kit", tag: "25+ Page Real Estate Website", theme: "realestate",
        description: "A full property-listing website for real estate agencies and independent brokers, with searchable/filterable property listings, dedicated agent profile pages, and inquiry forms wired to route leads straight to the right agent — designed to convert browsers into scheduled viewings.",
        features: ["Searchable & filterable property listings", "Individual property detail pages with gallery", "Agent profile pages with contact forms", "Mortgage/EMI calculator widget", "Neighborhood/area guide pages", "Map view for property locations"],
      },
      {
        name: "Portfolio Agency Kit", tag: "20+ Page Agency Website", theme: "business",
        description: "A polished portfolio and agency website template for designers, developers, and creative studios — case study layouts, a services breakdown, team page, and a client logo strip come pre-built so you can showcase real work convincingly from launch day.",
        features: ["Case study / project detail page template", "Services breakdown with pricing options", "Team member profile grid", "Client logo & testimonial strip", "Contact form with project brief fields", "Fast-loading, portfolio-optimized images"],
      },
      {
        name: "Wedding Planner Site", tag: "18+ Page Wedding Website", theme: "business",
        description: "An elegant website template for wedding planners and event decorators, with a portfolio gallery organized by event type, package pricing pages, and an inquiry form designed to capture the details planners actually need — date, guest count, and venue — on the first contact.",
        features: ["Event portfolio gallery by category", "Package & pricing comparison pages", "Detailed inquiry form (date, guests, venue)", "Client testimonial carousel", "Instagram feed integration", "Elegant, mobile-first design"],
      },
      {
        name: "Law Firm Website Kit", tag: "22+ Page Legal Website", theme: "business",
        description: "A professional, credibility-first website template for law firms and independent practitioners, with dedicated practice area pages, attorney bio pages listing case history and credentials, and a confidential consultation request form.",
        features: ["Practice area pages (family, corporate, criminal etc.)", "Attorney bio pages with credentials", "Confidential consultation request form", "Case results / testimonials section", "Blog template for legal articles", "Trust-building, professional design system"],
      },
    ],
  },
  {
    category: "SaaS Software", type: "saas", theme: "analytics", brand: "ToolzyPro", priceRange: [1499, 2999],
    items: [
      {
        name: "InvoiceFlow Pro", tag: "Invoicing & Billing SaaS",
        description: "InvoiceFlow Pro is a straightforward invoicing and billing tool for freelancers and small businesses who need to look professional without a full accounting suite. Create branded invoices in seconds, track which ones are paid, overdue, or pending, and send automatic payment reminders so you spend less time chasing clients.",
        features: ["Branded, customizable invoice templates", "Automatic overdue payment reminders", "Multi-currency invoicing support", "Client portal for payment history", "Recurring invoice scheduling", "Exportable reports for accounting"],
      },
      {
        name: "TeamSync CRM", tag: "Sales & Team CRM",
        description: "TeamSync CRM keeps your sales pipeline visible to the whole team instead of buried in one person's inbox. Track leads from first contact to closed deal on a visual pipeline board, log every call and email against the right contact automatically, and see team performance at a glance without building spreadsheets.",
        features: ["Visual drag & drop sales pipeline", "Automatic email & call logging per contact", "Team performance & activity dashboards", "Custom deal stages & pipelines", "Task reminders for follow-ups", "Third-party email integration (Gmail/Outlook)"],
      },
      {
        name: "Analytics Hub", tag: "Web Analytics Dashboard",
        description: "Analytics Hub gives you a privacy-friendly alternative to bulky analytics suites, showing exactly the numbers that matter — visitors, top pages, referral sources, and conversion events — in one clean dashboard, without the hundred menus and metrics you'll never look at.",
        features: ["Real-time visitor & traffic dashboard", "Referral source & campaign tracking", "Custom conversion event tracking", "Lightweight tracking script (fast page loads)", "Scheduled email reports", "No cookie-consent banner required"],
      },
      {
        name: "HelpDesk Pro", tag: "Customer Support Ticketing",
        description: "HelpDesk Pro turns scattered support emails into an organized ticket queue your team can actually manage — auto-assign tickets by category, track response-time SLAs, and give customers a self-service knowledge base so simple questions never need a human reply at all.",
        features: ["Shared ticket inbox with auto-assignment", "SLA tracking with response-time alerts", "Self-service knowledge base builder", "Canned responses for common questions", "Customer satisfaction (CSAT) surveys", "Multi-channel support (email + chat widget)"],
      },
      {
        name: "Project Manager Suite", tag: "Task & Project Management",
        description: "Project Manager Suite organizes team work across boards, lists, or timeline views — whichever fits how your team actually thinks — with task dependencies, file attachments, and time tracking built in, so status updates come from the tool instead of a separate meeting.",
        features: ["Board, list & timeline (Gantt) views", "Task dependencies & subtasks", "Built-in time tracking per task", "File attachments & comment threads", "Team workload view", "Project templates for recurring work types"],
      },
      {
        name: "Email Marketing Tool", tag: "Campaign Automation SaaS",
        description: "This email marketing tool handles both one-off newsletters and multi-step automated sequences from the same drag-and-drop builder, with segmentation rules that trigger the right email based on what a subscriber actually does — opens, clicks, or purchases — instead of blasting the same message to everyone.",
        features: ["Drag & drop email campaign builder", "Behavior-based automation sequences", "Subscriber segmentation & tagging", "A/B subject line testing", "Detailed open/click analytics", "List cleaning & deliverability tools"],
      },
    ],
  },
  {
    category: "AI Tools", type: "other", theme: "ai", brand: "AppsClap", priceRange: [699, 1999],
    items: [
      {
        name: "ContentGenie AI Writer", tag: "AI Content Generation",
        description: "ContentGenie AI Writer turns a topic and a few keywords into a publish-ready blog post, product description, or ad copy draft in under a minute. Built-in tone controls let you match your brand voice, and a plagiarism check runs automatically before you export, so what you publish is genuinely original.",
        features: ["50+ content templates (blog, ads, product copy)", "Adjustable tone & brand voice presets", "Built-in plagiarism checker", "Multi-language content generation", "Bulk content generation from a keyword list", "One-click export to WordPress"],
      },
      {
        name: "PixelCraft AI Image Suite", tag: "AI Image Generation",
        description: "PixelCraft AI Image Suite generates original marketing images, product mockups, and social media graphics from a text description — no stock photo license needed, and no design software required. Style presets keep every image on-brand, and an upscaler cleans up results for print-quality output.",
        features: ["Text-to-image generation with style presets", "Product mockup & social graphic templates", "4x AI upscaling for print-quality output", "Background removal & replacement", "Batch generation for campaigns", "Commercial usage rights included"],
      },
      {
        name: "ChatBot Builder AI", tag: "No-Code AI Chatbot Builder",
        description: "ChatBot Builder AI lets you launch a website chatbot that actually understands questions — not just keyword matching — by training it directly on your existing FAQ pages or help docs. When it can't answer, it hands off to a human agent with the full conversation history attached, so nothing gets lost.",
        features: ["Trains directly from your FAQ / help docs", "Natural language understanding, not keyword rules", "Seamless handoff to human agents", "Multi-language conversation support", "Embeddable widget for any website", "Conversation analytics dashboard"],
      },
      {
        name: "Voice Clone AI Studio", tag: "AI Voice Cloning Tool",
        description: "Voice Clone AI Studio creates a natural-sounding synthetic voice from a short audio sample, letting you generate narration for videos, podcasts, or IVR systems in a consistent voice without booking studio time every time you need a new line recorded.",
        features: ["Voice cloning from short audio samples", "Natural-sounding multi-language narration", "Adjustable tone, pace & emotion", "Bulk script-to-speech conversion", "Commercial license for video/podcast use", "High-quality WAV/MP3 export"],
      },
      {
        name: "AI Resume Builder", tag: "Smart Resume Generator",
        description: "AI Resume Builder turns a rough list of your work history into a polished, keyword-optimized resume tailored to a specific job description, flagging skills gaps against the posting and suggesting stronger action-verb phrasing so your application clears applicant tracking systems.",
        features: ["Job-description keyword matching & scoring", "ATS-friendly resume templates", "AI phrasing suggestions for bullet points", "Cover letter generator", "Multiple resume versions per job type", "PDF & Word export"],
      },
      {
        name: "Smart Video Editor AI", tag: "AI-Powered Video Editing",
        description: "Smart Video Editor AI automatically cuts long recordings down to the best highlight clips, adds auto-generated captions in your brand style, and reframes footage for vertical social formats — turning a single webinar or podcast recording into a week's worth of short-form content.",
        features: ["Automatic highlight clip detection", "Auto-generated, styled captions", "One-click vertical reframing for Reels/Shorts", "Silence & filler-word removal", "Background noise cleanup", "Direct export presets for social platforms"],
      },
    ],
  },
  {
    category: "Source Codes", type: "source-code", theme: "mobile", brand: "CodexBazaar", priceRange: [3999, 7999],
    items: [
      {
        name: "Food Delivery App Source", tag: "Full Source Code + Admin Panel",
        description: "A complete, ready-to-customize food delivery platform — customer app, restaurant panel, delivery-partner app, and a central admin dashboard, all included as full source code. Order tracking, live location, and payment integration are already wired up, so you're customizing an existing working system rather than building one from scratch.",
        features: ["Customer, restaurant & delivery-partner apps included", "Live order tracking with map integration", "Admin dashboard for restaurants & commissions", "Payment gateway integration pre-configured", "Push notifications for order status", "Full source code, no recurring license fee"],
      },
      {
        name: "Social Network Clone Script", tag: "PHP Social Network Script",
        description: "A full-featured PHP social networking platform with profiles, news feed, groups, messaging, and media sharing already built — a solid foundation for launching a niche community site without building the entire social graph and feed algorithm from zero.",
        features: ["News feed with likes, comments & shares", "Groups, pages & events modules", "Real-time private messaging", "Photo/video upload & albums", "Admin moderation panel", "Fully editable PHP/MySQL source"],
      },
      {
        name: "Chat App React Native Source", tag: "Cross-Platform Chat App",
        description: "A production-ready real-time chat application built in React Native for both iOS and Android from one codebase, with message delivery/read receipts, media sharing, and push notifications already implemented — ready to rebrand and extend for your own messaging product.",
        features: ["One codebase for iOS & Android", "Real-time messaging with read receipts", "Image, video & file sharing in chat", "Push notifications for new messages", "Group chat support", "Firebase backend integration included"],
      },
      {
        name: "Job Portal Script", tag: "Complete Job Board Platform",
        description: "A full job board platform with separate employer and job-seeker dashboards, resume uploads, application tracking, and paid job-listing plans already configured — everything needed to launch a niche recruitment site for a specific city or industry.",
        features: ["Separate employer & job-seeker dashboards", "Resume upload & applicant tracking", "Paid job listing plans with payment gateway", "Advanced job search & filtering", "Email alerts for matching new jobs", "SEO-friendly job listing pages"],
      },
      {
        name: "Learning Management System", tag: "Full LMS Source Code",
        description: "A complete learning management system source code with course creation, video lessons, quizzes, and student progress tracking — the same core feature set as major online course platforms, provided as source you own and can host and customize yourself.",
        features: ["Course builder with video, PDF & quiz lessons", "Student progress & completion tracking", "Certificate generation on course completion", "Instructor dashboard with earnings reports", "Discussion forum per course", "Payment gateway for paid courses"],
      },
      {
        name: "POS Billing System Source", tag: "Point of Sale Billing App",
        description: "A complete point-of-sale billing system source code for retail shops and restaurants — barcode scanning, inventory sync, and GST-compliant invoicing are already implemented, so you're deploying a working billing counter, not writing checkout logic from scratch.",
        features: ["Barcode scanning & product lookup", "Real-time inventory sync on every sale", "GST-compliant invoice generation", "Multiple payment mode support (cash/UPI/card)", "Daily sales & profit reports", "Multi-counter / multi-branch support"],
      },
    ],
  },
  {
    category: "PHP Scripts", type: "source-code", theme: "code", brand: "CodexBazaar", priceRange: [2999, 5999],
    items: [
      {
        name: "Multi-Vendor Marketplace Script", tag: "PHP Marketplace Platform",
        description: "A ready-to-deploy multi-vendor marketplace script where independent sellers manage their own storefronts, products, and orders, while you run the platform and collect commission on every sale — the same core model as major marketplace sites, provided as fully editable PHP source.",
        features: ["Vendor storefronts with own branding", "Commission-based order settlement", "Centralized admin approval for new vendors", "Product review & rating system", "Multiple payment gateway support", "SEO-friendly product & category pages"],
      },
      {
        name: "Classified Ads Script", tag: "Buy & Sell Classifieds Platform",
        description: "A complete classifieds platform script for buy-and-sell listings by category and location, with featured/paid listing options already built in, so a local classifieds site can start generating listing-fee revenue from day one.",
        features: ["Category & location-based listings", "Paid featured listing options", "In-app messaging between buyers & sellers", "Image gallery per listing", "Admin moderation & reporting tools", "Responsive design for mobile browsing"],
      },
      {
        name: "URL Shortener Script", tag: "Branded Link Shortener",
        description: "A self-hosted URL shortener script with your own branded domain, click analytics per link, and QR code generation — a practical alternative to public shorteners when you want full control over your links and their data.",
        features: ["Custom branded short domain support", "Click analytics (location, device, referrer)", "Auto QR code generation per link", "Password-protected & expiring links", "Bulk link shortening via CSV", "REST API for programmatic link creation"],
      },
      {
        name: "Blog CMS Script", tag: "Lightweight PHP Blog Engine",
        description: "A lightweight, fast-loading PHP blog engine for writers who want a simple publishing platform without the overhead of a full CMS — clean admin editor, categories/tags, and SEO-friendly URLs are all built in from the start.",
        features: ["Clean, distraction-free admin editor", "Categories, tags & related posts", "SEO-friendly URL structure", "Comment system with moderation", "RSS feed generation", "Lightweight, fast page loads"],
      },
      {
        name: "Auction Script", tag: "Online Bidding Platform",
        description: "A complete online auction platform script with real-time bidding, automatic bid increments, and auction countdown timers already implemented, ready to launch a niche auction site for anything from collectibles to industrial equipment.",
        features: ["Real-time bidding with live updates", "Automatic bid increment rules", "Auction countdown timer per listing", "Seller & buyer rating system", "Payment escrow / hold on winning bid", "Admin dashboard for auction management"],
      },
    ],
  },
  {
    category: "Laravel Projects", type: "source-code", theme: "code", brand: "CodexBazaar", priceRange: [2999, 5999],
    items: [
      {
        name: "Laravel POS System", tag: "Retail Point of Sale App",
        description: "A retail point-of-sale application built on Laravel with inventory management, barcode support, and sales reporting already implemented — clean, well-structured code that's straightforward to extend for a specific retail workflow.",
        features: ["Barcode-based product checkout", "Real-time stock & inventory management", "Daily/weekly/monthly sales reports", "Multi-user roles (cashier, manager, admin)", "Discount & tax rule configuration", "Clean Laravel MVC codebase, easy to extend"],
      },
      {
        name: "Laravel CRM Starter Kit", tag: "Customer Relationship Manager",
        description: "A CRM starter built on Laravel with contact management, deal pipelines, and activity logging already scaffolded, giving you a solid foundation to customize into an industry-specific CRM instead of building the data model from scratch.",
        features: ["Contact & company management", "Visual deal/sales pipeline", "Activity & interaction timeline per contact", "Role-based access control", "Email integration for logging conversations", "Well-documented Laravel codebase"],
      },
      {
        name: "Laravel Invoice Generator", tag: "Billing & Invoicing App",
        description: "A Laravel-based invoicing application with recurring billing, PDF invoice generation, and payment tracking already built, suited for agencies or freelance businesses that want to self-host their own billing tool.",
        features: ["Recurring & one-time invoice generation", "Branded PDF invoice export", "Payment status tracking (paid/pending/overdue)", "Client portal for invoice history", "Multi-currency support", "Clean, extensible Laravel codebase"],
      },
      {
        name: "Laravel Multi-Restaurant System", tag: "Restaurant Chain Manager",
        description: "A multi-branch restaurant management system built on Laravel for chains and franchises — each branch manages its own menu, orders, and staff, while head office gets a consolidated view of performance across every location.",
        features: ["Multi-branch menu & pricing management", "Centralized reporting across all branches", "Order & table management per branch", "Staff role management per location", "Inventory tracking per branch", "Built on Laravel's clean MVC architecture"],
      },
      {
        name: "Laravel Job Board", tag: "Job Listing Platform",
        description: "A job board platform built on Laravel with employer accounts, job posting workflows, and applicant tracking already implemented, providing a clean starting codebase for a niche recruitment site.",
        features: ["Employer job posting workflow", "Applicant tracking per job listing", "Resume upload & candidate search", "Paid job listing packages", "Email notifications for new applications", "Well-structured, documented Laravel code"],
      },
    ],
  },
  {
    category: "React Projects", type: "source-code", theme: "code", brand: "CodexBazaar", priceRange: [2999, 5999],
    items: [
      {
        name: "React Admin Dashboard Kit", tag: "Modern Admin Panel Template",
        description: "A modern, component-based admin dashboard template built in React with charts, tables, and form components already styled and ready to wire up to your own API — a significant head start over building an admin panel's UI layer from scratch.",
        features: ["50+ pre-built UI components", "Chart & data visualization widgets", "Data tables with sorting/filtering/pagination", "Authentication & role-based routing scaffolding", "Dark/light theme toggle", "Clean, well-organized component structure"],
      },
      {
        name: "React Native E-commerce App", tag: "Full Mobile Shopping App",
        description: "A complete mobile shopping app built in React Native with product browsing, cart, checkout, and order history screens already designed and functional, giving you a working starting point for a branded shopping app rather than a blank project.",
        features: ["Product catalog with categories & search", "Cart & multi-step checkout flow", "Order history & tracking screens", "Push notifications for order updates", "Wishlist & product reviews", "One codebase for iOS & Android"],
      },
      {
        name: "React Portfolio Template", tag: "Developer Portfolio Site",
        description: "A clean, animated portfolio template built in React for developers and designers who want a modern personal site without wiring up animation libraries and layout systems from scratch — project showcase, resume section, and contact form are all pre-built.",
        features: ["Animated project showcase grid", "Resume/CV section with timeline", "Contact form with email integration", "Fully responsive, mobile-first layout", "Easy content updates via config file", "Fast load times, optimized build"],
      },
      {
        name: "React Chat Application", tag: "Real-Time Chat App",
        description: "A real-time chat application built in React with WebSocket-based messaging, typing indicators, and online-status already implemented — a solid base for building anything from a support widget to a full messaging product.",
        features: ["Real-time messaging via WebSockets", "Typing indicators & online status", "Group and one-to-one conversations", "Message history & search", "File/image sharing in chat", "Clean, reusable component architecture"],
      },
      {
        name: "React Food Ordering App", tag: "Restaurant Ordering Frontend",
        description: "A polished food-ordering frontend built in React with menu browsing, cart management, and a multi-step checkout already designed, ready to connect to your restaurant's backend or a delivery API.",
        features: ["Menu browsing with category filters", "Cart with quantity & customization options", "Multi-step checkout flow", "Order tracking screen", "Responsive design for mobile ordering", "Easy to connect to any backend API"],
      },
    ],
  },
  {
    category: "Mobile Apps", type: "other", theme: "mobile", brand: "AppsClap", priceRange: [3999, 6999],
    items: [
      {
        name: "On-Demand Delivery App", tag: "Full Delivery App Solution",
        description: "A complete on-demand delivery app solution covering customer ordering, driver assignment, and live tracking — the same core structure used by delivery startups, ready to be rebranded and launched for groceries, parcels, or any delivery vertical.",
        features: ["Customer app with real-time order tracking", "Driver app with route optimization", "Automatic order-to-driver assignment", "In-app payments & COD support", "Admin dashboard for fleet management", "Push notifications at every order stage"],
      },
      {
        name: "Fitness Tracker App", tag: "Health & Workout Tracking App",
        description: "A fitness tracking app template with workout logging, progress charts, and goal setting already built — a strong foundation for launching a branded fitness app without building the tracking and charting logic yourself.",
        features: ["Workout logging with exercise library", "Progress charts (weight, reps, streaks)", "Custom goal setting & reminders", "Step & activity tracking integration", "Social sharing of achievements", "Clean, motivating UI design"],
      },
      {
        name: "Taxi Booking App UI Kit", tag: "Ride-Hailing App Template",
        description: "A ride-hailing app UI kit with rider and driver app screens fully designed — booking flow, live map tracking, fare estimation, and driver arrival screens are all included, ready to connect to your own backend and mapping API.",
        features: ["Rider & driver app screens included", "Live map tracking UI", "Fare estimation screen", "Ride history & receipts", "Driver arrival & in-ride status screens", "Ready to connect to any maps/backend API"],
      },
      {
        name: "Social Media App Template", tag: "Instagram-Style App Kit",
        description: "A social media app template with a photo/video feed, stories, likes, comments, and a profile system already designed and functional — a practical starting point for launching a niche social app rather than a generic clone.",
        features: ["Photo/video feed with likes & comments", "Stories with 24-hour expiry", "User profiles & follow system", "Direct messaging screens", "Explore/discovery feed", "Clean, modern UI matching current app trends"],
      },
      {
        name: "E-Learning Mobile App", tag: "Online Courses Mobile App",
        description: "An e-learning mobile app template with course browsing, video lessons, and progress tracking already built, giving you a working student-facing app to pair with any course backend or LMS.",
        features: ["Course catalog with categories", "Video lesson player with progress tracking", "Quiz & assessment screens", "Certificate download on completion", "Offline video download support", "Push notifications for new lessons"],
      },
    ],
  },
  {
    category: "Templates", type: "other", theme: "webdesign", priceRange: [499, 1499],
    items: [
      {
        name: "Landing Page Template Pack", tag: "20+ High-Converting Landing Pages",
        description: "A pack of 20+ conversion-focused landing page templates covering SaaS, agencies, apps, and events — each one built around a clear call-to-action structure that's already proven to convert, so you're adapting a working layout instead of designing one from a blank page.",
        features: ["20+ industry-specific landing page layouts", "Conversion-optimized section structure", "Fully editable in Figma & HTML/CSS", "Mobile-responsive out of the box", "Easy color & font customization", "Includes matching thank-you page templates"],
      },
      {
        name: "Email Newsletter Templates", tag: "Responsive Email Design Pack",
        description: "A pack of responsive HTML email templates designed to render correctly across Gmail, Outlook, and Apple Mail — the notoriously inconsistent rendering across email clients is already handled, so you just drop in your content.",
        features: ["Tested across major email clients", "Drag & drop editable sections", "Responsive layout for mobile inboxes", "Dark-mode friendly color options", "Compatible with Mailchimp, Klaviyo & more", "Includes promotional & newsletter variants"],
      },
      {
        name: "Resume/CV Template Bundle", tag: "Professional Resume Designs",
        description: "A bundle of professional resume and CV designs formatted to pass through applicant tracking systems while still looking distinctive to a human reviewer — available in editable Word and Canva formats for quick customization.",
        features: ["ATS-friendly formatting", "Editable in Word & Canva", "Matching cover letter templates included", "Multiple color scheme variants", "Print-ready A4 & Letter sizing", "Icon sets for skills & contact info"],
      },
      {
        name: "Presentation Template Kit", tag: "Business Slide Deck Templates",
        description: "A business presentation template kit for pitch decks, quarterly reports, and proposals, with a consistent design system across every slide so your deck looks cohesive without hours spent aligning fonts and colors slide by slide.",
        features: ["100+ pre-designed slide layouts", "Consistent design system across slides", "Editable charts & infographics", "PowerPoint & Google Slides compatible", "Pitch deck & report slide variants", "Icon library included"],
      },
      {
        name: "Invoice Template Pack", tag: "Editable Invoice Designs",
        description: "A pack of clean, professional invoice templates in editable Word, Excel, and PDF formats, with automatic total calculations built into the spreadsheet versions so you're not doing manual math for every invoice.",
        features: ["Editable Word, Excel & PDF formats", "Automatic total & tax calculations (Excel)", "Multiple professional design variants", "Multi-currency friendly layout", "Easy logo & brand color customization", "Print-ready formatting"],
      },
    ],
  },
  {
    category: "Bundles", type: "other", theme: "business", priceRange: [4999, 9999],
    items: [
      {
        name: "Mega WordPress Bundle", tag: "40+ Plugins & Themes Bundle",
        description: "A single bundle covering 40+ premium WordPress plugins and themes across SEO, page building, security, and design — instead of buying each license separately at full price, this bundle covers an entire agency's typical toolkit in one purchase.",
        features: ["40+ premium plugins & themes included", "Covers SEO, security, page builders & more", "Lifetime access to bundled items", "Regular additions of new items", "Single license for all included tools", "Massive savings vs individual pricing"],
      },
      {
        name: "Complete SaaS Starter Bundle", tag: "SaaS Boilerplate + Admin + App",
        description: "A full SaaS starter bundle combining a backend boilerplate, admin dashboard, and customer-facing app UI — authentication, billing integration, and role management are already wired together, so you're customizing a working SaaS skeleton, not assembling one from separate parts.",
        features: ["Backend boilerplate with auth & billing", "Admin dashboard included", "Customer-facing app UI included", "Stripe/Razorpay subscription billing pre-wired", "Role & permission management scaffolding", "Well-documented setup guide"],
      },
      {
        name: "Design Assets Mega Bundle", tag: "1000+ Design Assets Pack",
        description: "A design assets mega bundle with 1000+ icons, illustrations, UI kits, and mockups covering most common design needs in one purchase, saving the time (and cost) of separately licensing assets from multiple marketplaces.",
        features: ["1000+ icons, illustrations & mockups", "Multiple UI kits included", "Commercial usage license", "Organized, searchable asset library", "Regular new asset additions", "Compatible with Figma, Sketch & Adobe XD"],
      },
      {
        name: "Developer Tools Bundle", tag: "10 Essential Dev Tools Pack",
        description: "A bundle of 10 essential developer tools — API testing, database backup, code snippet management, and more — covering the daily-use utility layer most development teams end up assembling piecemeal, provided as one coordinated toolkit.",
        features: ["10 essential developer tools included", "Covers API testing, backups, snippets & more", "Single license for entire toolkit", "Regular tool updates included", "Priority support across all tools", "Significant savings vs buying separately"],
      },
    ],
  },
  {
    category: "Graphics", type: "other", theme: "webdesign", priceRange: [499, 1499],
    items: [
      {
        name: "Icon Pack Pro", tag: "2000+ Premium Icons",
        description: "A library of 2000+ hand-crafted icons across UI, business, and lifestyle categories, delivered in multiple formats (SVG, PNG, icon font) so they drop straight into whatever design or development tool you're using.",
        features: ["2000+ icons across multiple categories", "SVG, PNG & icon font formats included", "Consistent stroke-width design system", "Editable colors & sizes", "Regularly updated with new icon sets", "Commercial usage license"],
      },
      {
        name: "Stock Photo Collection", tag: "500+ Royalty-Free Photos",
        description: "A collection of 500+ high-resolution, royalty-free stock photos across business, technology, and lifestyle themes, licensed for unlimited commercial use — no per-image licensing fees or attribution requirements to track.",
        features: ["500+ high-resolution photos", "Business, tech & lifestyle categories", "Unlimited commercial usage license", "No attribution required", "Organized by category & color palette", "New photos added regularly"],
      },
      {
        name: "UI Kit for Figma", tag: "Complete App UI Kit",
        description: "A comprehensive Figma UI kit with pre-built screens, components, and a design system (colors, type scale, spacing) for mobile and web apps — a strong starting point for a new product design rather than building a component library from zero.",
        features: ["100+ pre-built app screens", "Complete design system (colors, type, spacing)", "Auto-layout components in Figma", "Light & dark mode variants", "Organized component library", "Regular updates with new screens"],
      },
      {
        name: "Illustration Pack", tag: "100+ Custom Illustrations",
        description: "A pack of 100+ custom vector illustrations in a consistent style, covering common website themes like onboarding, empty states, and marketing sections — ready to drop into a product or landing page for visual polish without commissioning custom art.",
        features: ["100+ illustrations in consistent style", "Covers onboarding, empty states & marketing", "Editable vector (SVG/AI) format", "Multiple color palette variants", "Commercial usage license", "Regularly expanded illustration set"],
      },
      {
        name: "Mockup Bundle", tag: "Device & Product Mockups",
        description: "A bundle of high-quality device and product mockups — phones, laptops, packaging, and print materials — for presenting app screens or product designs realistically in portfolios and marketing materials.",
        features: ["Device mockups (phone, laptop, tablet)", "Product & packaging mockups", "High-resolution PSD/Figma files", "Smart-object layers for easy swapping", "Multiple angles & backgrounds", "Commercial usage license"],
      },
    ],
  },
  {
    category: "Marketing Tools", type: "saas", theme: "analytics", brand: "ToolzyPro", priceRange: [1499, 2999],
    items: [
      {
        name: "Social Media Scheduler", tag: "Multi-Platform Post Scheduler",
        description: "A social media scheduling tool that lets you plan and queue posts across Instagram, Facebook, X, and LinkedIn from one calendar view, with best-time-to-post suggestions based on your own audience's activity patterns.",
        features: ["Multi-platform scheduling from one calendar", "Best-time-to-post suggestions", "Bulk upload & queue via CSV", "Team approval workflow for posts", "Performance analytics per post", "Hashtag suggestion tool"],
      },
      {
        name: "Email Campaign Builder", tag: "Drag & Drop Email Designer",
        description: "An email campaign builder with a visual drag-and-drop designer, pre-built campaign templates, and automation triggers, so a small marketing team can run professional email campaigns without a dedicated designer or developer.",
        features: ["Drag & drop visual email designer", "Pre-built campaign template library", "Automation triggers (welcome, abandoned cart etc.)", "A/B testing for subject lines", "Detailed open/click/conversion analytics", "List segmentation tools"],
      },
      {
        name: "Landing Page Builder Pro", tag: "No-Code Landing Page Builder",
        description: "A no-code landing page builder for marketers who need to launch campaign pages fast — drag-and-drop sections, built-in A/B testing, and direct integration with ad platforms mean a page can go from idea to live in under an hour.",
        features: ["No-code drag & drop page builder", "Built-in A/B testing", "Direct ad-platform pixel integration", "Mobile-responsive by default", "Form builder with lead capture", "Fast-loading, SEO-friendly pages"],
      },
      {
        name: "Affiliate Management System", tag: "Track & Manage Affiliates",
        description: "An affiliate management system for tracking referral links, calculating commissions automatically, and managing payouts to affiliates — everything needed to run an affiliate program without spreadsheet reconciliation at the end of the month.",
        features: ["Unique referral link generation per affiliate", "Automatic commission calculation", "Affiliate dashboard with real-time stats", "Bulk payout processing", "Custom commission tiers", "Fraud detection for suspicious clicks"],
      },
    ],
  },
  {
    category: "SEO Tools", type: "saas", theme: "analytics", brand: "ToolzyPro", priceRange: [1499, 2999],
    items: [
      {
        name: "Keyword Research Tool", tag: "Find High-Volume Keywords",
        description: "A keyword research tool that surfaces high-volume, low-competition keywords for any topic, along with related questions people are actually searching for, so your content targets what people search, not just what sounds relevant.",
        features: ["Search volume & competition scoring", "Related questions & topic clusters", "Competitor keyword gap analysis", "Local & country-specific keyword data", "Keyword list export (CSV)", "Historical trend charts per keyword"],
      },
      {
        name: "Backlink Checker Pro", tag: "Monitor & Analyze Backlinks",
        description: "A backlink monitoring tool that tracks every link pointing to your site, flags newly lost or toxic links immediately, and lets you benchmark your backlink profile directly against competitors in the same niche.",
        features: ["Full backlink profile monitoring", "New & lost link alerts", "Toxic link detection", "Competitor backlink comparison", "Domain authority scoring", "Scheduled email reports"],
      },
      {
        name: "SEO Audit Software", tag: "Full Site SEO Audit Tool",
        description: "An automated SEO audit tool that crawls your entire site and flags technical issues — broken links, slow pages, missing meta tags — then prioritizes fixes by potential ranking impact, so you know what to fix first.",
        features: ["Full-site technical crawl & audit", "Issue prioritization by ranking impact", "Broken link & redirect chain detection", "Page speed & Core Web Vitals check", "Scheduled recurring audits", "White-label PDF reports"],
      },
      {
        name: "Rank Tracker Tool", tag: "Track Google Rankings Daily",
        description: "A rank tracking tool that checks your target keywords' Google positions daily across desktop and mobile, with historical charts showing exactly when a ranking change happened — useful for connecting SEO changes to their actual ranking impact.",
        features: ["Daily rank tracking, desktop & mobile", "Historical ranking trend charts", "Competitor rank comparison", "Local rank tracking by city", "SERP feature tracking (featured snippets etc.)", "Automated weekly reports"],
      },
    ],
  },
  {
    category: "Documents", type: "other", theme: "education", priceRange: [299, 999],
    items: [
      {
        name: "Legal Contract Templates", tag: "50+ Ready-to-Use Contracts",
        description: "A library of 50+ ready-to-use legal contract templates — NDAs, service agreements, employment contracts, and more — drafted in plain, editable language so you can adapt them to your specific situation without starting from a blank document.",
        features: ["50+ contract templates included", "Covers NDAs, service & employment agreements", "Editable Word format", "Plain-language drafting for easy customization", "Organized by contract category", "Regularly updated template library"],
      },
      {
        name: "Business Plan Template", tag: "Investor-Ready Business Plan",
        description: "An investor-ready business plan template with a pre-built structure covering market analysis, financial projections, and go-to-market strategy — the sections investors actually expect to see, already organized in the right order.",
        features: ["Full business plan structure included", "Financial projection spreadsheet template", "Market analysis section framework", "Pitch-ready executive summary format", "Editable in Word & Excel", "Investor-focused section ordering"],
      },
      {
        name: "Invoice & Billing Docs Pack", tag: "Editable Billing Documents",
        description: "A pack of editable billing documents — invoices, receipts, purchase orders, and credit notes — covering the paperwork most small businesses need, in consistent, professional formatting across every document type.",
        features: ["Invoices, receipts, POs & credit notes", "Consistent professional formatting", "Editable Word & Excel formats", "Automatic total calculations (Excel)", "Easy logo & brand customization", "Print-ready layouts"],
      },
      {
        name: "HR Document Bundle", tag: "Employee Policy & HR Forms",
        description: "An HR document bundle covering employee handbooks, leave policies, offer letters, and performance review forms — the core paperwork a growing team needs, already drafted and ready to adapt to your company's specifics.",
        features: ["Employee handbook template", "Leave & attendance policy templates", "Offer letter & appointment letter formats", "Performance review form templates", "Editable Word format throughout", "Covers core HR compliance documents"],
      },
    ],
  },
  {
    category: "Courses", type: "other", theme: "education", priceRange: [999, 2999],
    items: [
      {
        name: "Full Stack Web Dev Course", tag: "Complete MERN Stack Course",
        description: "A complete full-stack web development course covering MongoDB, Express, React, and Node.js from fundamentals through to deploying a real production project — structured as a project-based curriculum rather than disconnected lecture videos.",
        features: ["Project-based MERN stack curriculum", "Covers MongoDB, Express, React & Node.js", "Real deployment walkthrough included", "Downloadable source code for every project", "Lifetime access to course updates", "Certificate of completion"],
      },
      {
        name: "Digital Marketing Masterclass", tag: "SEO, Ads & Social Media",
        description: "A digital marketing masterclass covering SEO, paid ads (Google & Meta), and social media strategy in one structured course — designed for business owners and marketers who need practical, campaign-ready skills, not just theory.",
        features: ["Covers SEO, Google Ads & Meta Ads", "Social media strategy & content planning", "Real campaign case studies", "Downloadable templates & checklists", "Lifetime access & updates", "Certificate of completion"],
      },
      {
        name: "UI/UX Design Course", tag: "From Beginner to Pro",
        description: "A UI/UX design course taking you from design fundamentals through to a portfolio-ready case study, covering user research, wireframing, and prototyping in Figma along the way — structured so you finish with real work to show, not just notes.",
        features: ["Figma-based practical curriculum", "User research & wireframing modules", "Portfolio case study project included", "Prototyping & handoff techniques", "Lifetime access to course updates", "Certificate of completion"],
      },
      {
        name: "WordPress Development Course", tag: "Build Sites & Plugins",
        description: "A WordPress development course covering theme customization, plugin development, and WooCommerce store setup — for developers who want to build custom WordPress solutions professionally, not just use pre-made themes.",
        features: ["Theme customization & child themes", "Custom plugin development from scratch", "WooCommerce store setup & customization", "Real client-project style exercises", "Lifetime access & updates", "Certificate of completion"],
      },
    ],
  },
  {
    category: "eBooks", type: "other", theme: "education", priceRange: [299, 799],
    items: [
      {
        name: "The Complete SEO Guide eBook", tag: "Master Search Engine Optimization",
        description: "A comprehensive SEO guide covering on-page optimization, technical SEO, and link building in plain language with real examples — written to be immediately actionable rather than a theoretical overview of ranking factors.",
        features: ["Covers on-page, technical & off-page SEO", "Real-world examples throughout", "Actionable checklists per chapter", "Beginner-friendly explanations", "PDF & EPUB formats included", "Lifetime access to updated editions"],
      },
      {
        name: "JavaScript Mastery eBook", tag: "Deep Dive into Modern JS",
        description: "A deep-dive eBook into modern JavaScript — closures, async patterns, and ES2020+ features explained with practical code examples, aimed at developers who know JS basics but want to genuinely understand what's happening under the hood.",
        features: ["Deep dive into closures & async patterns", "Covers ES2020+ modern JS features", "Practical, runnable code examples", "Common interview question explanations", "PDF & EPUB formats included", "Free updates for new JS features"],
      },
      {
        name: "Freelancing Success eBook", tag: "Build a 6-Figure Freelance Career",
        description: "A practical guide to building a sustainable freelance career — pricing your work, finding clients, and managing projects professionally — written from real freelance experience rather than generic motivational advice.",
        features: ["Client acquisition strategies", "Pricing & proposal frameworks", "Project & client management tips", "Real freelancer case studies", "Downloadable proposal templates", "PDF & EPUB formats included"],
      },
      {
        name: "WordPress Business eBook", tag: "Start a WordPress Agency",
        description: "A guide to starting and running a WordPress services agency — from productizing your services and pricing packages to finding your first clients — written for developers who want to turn WordPress skills into a business.",
        features: ["Service productization & pricing guidance", "Client acquisition strategies", "Sample service package structures", "Contract & scope-of-work guidance", "Real agency case studies", "PDF & EPUB formats included"],
      },
    ],
  },
  {
    category: "Developer Tools", type: "other", theme: "security", brand: "ToolzyPro", priceRange: [999, 2499],
    items: [
      {
        name: "API Testing Tool", tag: "Test & Debug REST APIs",
        description: "An API testing tool for sending requests, inspecting responses, and organizing test collections by project — built for developers who want a fast, focused testing workflow without a bloated general-purpose HTTP client.",
        features: ["Organized request collections by project", "Environment variables for dev/staging/prod", "Automated test assertions per request", "Response history & comparison", "Team collection sharing", "Import from OpenAPI/Swagger specs"],
      },
      {
        name: "Database Backup Manager", tag: "Automated DB Backups",
        description: "A database backup manager that schedules automatic backups across MySQL, PostgreSQL, and MongoDB, stores them securely off-server, and makes restoring a specific point-in-time backup a one-click operation instead of a manual export/import.",
        features: ["Scheduled automatic backups", "Supports MySQL, PostgreSQL & MongoDB", "Secure off-server backup storage", "One-click point-in-time restore", "Backup integrity verification", "Email alerts on backup failure"],
      },
      {
        name: "Code Snippet Manager", tag: "Organize Reusable Code",
        description: "A code snippet manager for saving, tagging, and searching reusable code across every language and project you work in — with syntax highlighting and team sharing, so useful snippets don't get lost in random text files.",
        features: ["Syntax highlighting for 100+ languages", "Tag-based organization & search", "Team snippet sharing & libraries", "Version history per snippet", "Quick-copy keyboard shortcuts", "Cross-device sync"],
      },
      {
        name: "Git Workflow Toolkit", tag: "Streamline Git Branching",
        description: "A Git workflow toolkit that enforces consistent branching and commit conventions across a team, with visual branch/merge diagrams and pre-commit hook templates that catch mistakes before they reach the main branch.",
        features: ["Standardized branching workflow templates", "Visual branch & merge diagrams", "Pre-commit hook templates", "Commit message convention enforcement", "PR/merge checklist automation", "Team onboarding documentation included"],
      },
      {
        name: "Server Monitoring Dashboard", tag: "Real-Time Server Health",
        description: "A server monitoring dashboard tracking CPU, memory, disk, and uptime across every server you manage from one screen, with instant alerts before small issues become downtime and historical graphs to spot slow performance degradation over time.",
        features: ["Real-time CPU, memory & disk monitoring", "Instant alert notifications via email/SMS", "Multi-server dashboard support", "One-click setup, no coding required", "Historical performance graphs", "Lifetime free updates"],
      },
    ],
  },
  {
    category: "Developer Tools", type: "tool", theme: "analytics", brand: "ToolzyPro", priceRange: [999, 2499],
    items: [
      {
        name: "SEO Crawler & Auditor Pro", tag: "Web SEO Crawler & Link Auditor",
        description: "Analyze any website's SEO health, indexability, page load speeds, and metadata structure dynamically. It generates white-label audit reports that you can brand and send to clients to convert them to paying customers.",
        features: ["Deep crawl link analysis & redirect chains", "XML sitemap verification & check", "Core Web Vitals loading metrics", "Custom PDF white-label reports generator"],
      },
      {
        name: "Bulk Image Compressor AI", tag: "AI-Powered Bulk Image Compressor",
        description: "Reduce image file sizes by up to 80% without losing quality. Works on WebP, PNG, and JPG formats. Super easy to configure and deploy as a self-hosted API widget.",
        features: ["Smart lossy & lossless compression", "Bulk drag-and-drop file uploader", "WebP & Avif auto-conversion", "Developer API key billing support"],
      },
      {
        name: "Security Scan Vulnerability Tool", tag: "Server & Code Security Scanner",
        description: "Scans PHP and JS codebases for common vulnerabilities, out-of-date packages, and SQL injection flaws. Essential tool for web developers and admins.",
        features: ["Static code analysis threat scanner", "OWASP top 10 vulnerability checks", "Automatic PDF report generator", "Scheduled daily security scanning"],
      },
      {
        name: "Dynamic QR Code Builder SaaS", tag: "QR Code Marketing Platform",
        description: "Generate and track dynamic QR codes for menus, events, app downloads, and marketing campaigns. Complete with a manageable multi-brand dashboard.",
        features: ["Dynamic URL redirection tracking & analytics", "Custom logo & brand styled templates", "Real-time scan counter statistics", "Vector SVG & high-res PNG export formats"],
      },
      {
        name: "Server Speed Optimizer", tag: "Performance Optimization Tool",
        description: "Analyze server response bottlenecks and automatically configure optimized caching directives, OPcache profiles, and Gzip/Brotli headers for faster page load times.",
        features: ["Server bottleneck tracer & report", "OPcache profile fine-tuner", "Gzip & Brotli config script generator", "One-click deployment for Apache & Nginx"],
      },
      {
        name: "Dynamic Link Cloaker", tag: "Short Link Management Software",
        description: "Create professional branded short links with built-in geo-targeting redirection, device type detection, and scan tracking analytics. Ideal for marketing teams.",
        features: ["Dynamic georouting URL redirects", "Device-aware link forwarding rules", "Real-time analytics click maps", "Branded short domain setup guides"],
      },
      {
        name: "Database Security Shield", type: "tool", tag: "Real-Time SQL Guard",
        description: "Monitor database queries in real-time, blocking unauthorized attempts, privilege escalation queries, and SQL injection exploits before they breach your servers.",
        features: ["Real-time SQL query tracer & auditor", "SQL injection exploit blocker", "Privilege escalation query check alerts", "Daily security posture report logs"],
      },
      {
        name: "CSS & JS Minifier API", tag: "Developer Build Optimizer",
        description: "Minify and compile front-end assets on the fly with a simple REST API, bulk directory uploader, and custom optimization algorithms that preserve JS functionality.",
        features: ["Smart lossy asset minifier algorithm", "API key setup for automated pipelines", "Bulk directory folder builder zip", "Supports Tailwind & ES6 compilation"],
      },
      {
        name: "AI Website Translation Widget", tag: "AI Language Translation SaaS",
        description: "Translate website content dynamically into 50+ languages using self-hosted lightweight AI translation models. Zero latency, high accuracy, and easy configuration.",
        features: ["Self-hosted offline machine translation models", "Auto-locale redirection triggers", "Fuzzy-logic translation editor admin", "Supports 50+ international languages"],
      },
      {
        name: "Web Scraping API SaaS", tag: "Proxy-Protected Web Scraper",
        description: "Extract data from any web page smoothly, bypassing CAPTCHAs, cookie prompts, and cloudflare blockers. Ready to use as a self-hosted API widget.",
        features: ["CAPTCHA & cookie bypass wrappers", "Rotating IP proxy pools built-in", "JSON structure content parser", "API dashboard metrics & analytics logs"],
      },
      {
        name: "Uptime & Port Monitor", tag: "Server Health Warning System",
        description: "Ping servers and monitor HTTP/TCP ports continuously, sending instant notifications via Telegram or Discord on failure to minimize site downtime.",
        features: ["Continuous port ping monitoring check", "Instant Telegram & Discord alerts integration", "Uptime status page public template", "Weekly reliability performance logs"],
      },
      {
        name: "Digital License Manager", tag: "API Key & License Distributor",
        description: "Issue, verify, and track API keys and licenses for themes, plugins, and software products. Fully integrable with WordPress and custom billing APIs.",
        features: ["Dynamic API key generator dashboard", "WooCommerce license verification addon", "Active site verification logs", "Custom webhooks for license revocation"],
      }
    ]
  }
]

async function seed() {
  await connectDB()

  for (const c of categories) {
    await Category.updateOne(
      { name: c.name },
      { $setOnInsert: { ...c, slug: slugify(c.name) } },
      { upsert: true }
    )
  }
  console.log(`Seeded ${categories.length} categories`)

  for (const b of brands) {
    const { logo, website, ...rest } = b
    await Brand.updateOne(
      { name: b.name },
      { $set: { logo, website }, $setOnInsert: { ...rest, slug: slugify(b.name) } },
      { upsert: true }
    )
  }
  console.log(`Seeded ${brands.length} brands`)

  const categoryDocs = await Category.find()
  const categoryIdByName = new Map(categoryDocs.map((c) => [c.name, c._id]))
  const brandDocs = await Brand.find()
  const brandIdByName = new Map(brandDocs.map((b) => [b.name, b._id]))

  let createdProducts = 0
  let updatedProducts = 0
  let featuredCount = 0

  for (const group of productGroups) {
    for (let i = 0; i < group.items.length; i++) {
      const { name, tag, theme: themeOverride, description, features } = group.items[i]
      const [minPrice, maxPrice] = group.priceRange
      const price = Math.round(rand(minPrice, maxPrice) / 100) * 100
      const onSale = Math.random() < 0.55
      const salePrice = onSale ? Math.round((price * (rand(60, 80) / 100)) / 50) * 50 : undefined
      // first product of every group is featured, giving a healthy spread across categories
      const featured = i === 0
      if (featured) featuredCount++

      const fields = {
        shortDescription: tag,
        description: description || tag,
        features: features || [],
        price,
        salePrice,
        category: categoryIdByName.get(group.category),
        brand: group.brand ? brandIdByName.get(group.brand) : undefined,
        type: group.type,
        rating: Number((rand(43, 49) / 10).toFixed(1)),
        numReviews: rand(40, 4200),
        featured,
        status: "published",
      }

      const image = stockImage(themeOverride || group.theme, name)

      const existing = await Product.findOne({ name })
      if (existing) {
        Object.assign(existing, fields)
        existing.images = [image]
        await existing.save()
        updatedProducts++
      } else {
        await Product.create({ name, ...fields, images: [image] })
        createdProducts++
      }
    }
  }

  console.log(`Seeded demo products: ${createdProducts} new, ${updatedProducts} updated across ${productGroups.length} categories (${featuredCount} featured)`)

  const existingSettings = await PaymentSetting.findOne()
  if (!existingSettings) {
    await PaymentSetting.create({})
    console.log("Seeded empty payment settings (fill in from /admin/settings)")
  }

  const adminEmail = process.env.ADMIN_EMAIL
  const existingAdmin = await User.findOne({ email: adminEmail })
  if (!existingAdmin) {
    await User.create({
      name: process.env.ADMIN_NAME || "Admin",
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
    })
    console.log(`Created admin user: ${adminEmail} / ${process.env.ADMIN_PASSWORD}`)
  } else {
    console.log(`Admin user already exists: ${adminEmail}`)
  }

  console.log("Seed complete")
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
