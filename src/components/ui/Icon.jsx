// Explicit icon registry — only the icons the app actually uses, so the
// bundler tree-shakes lucide instead of pulling in all ~2000 glyphs.
import {
  Activity, Atom, BookOpen, Box, Boxes, Briefcase, Building2, Clock, Cloud,
  Code2, Download, Dumbbell, FileCode2, FileText, Globe, GraduationCap, Grid3x3,
  Headphones, Image, LayoutDashboard, LayoutGrid, LayoutTemplate, Megaphone,
  Monitor, Package, Palette, PlayCircle, ShoppingCart, Smartphone, Smile,
  Sparkles, Stethoscope, TrendingUp, Users, UtensilsCrossed, Wrench,
} from "lucide-react"

const REGISTRY = {
  Activity, Atom, BookOpen, Boxes, Briefcase, Building2, Clock, Cloud, Code2,
  Download, Dumbbell, FileCode2, FileText, Globe, GraduationCap, Grid3x3,
  Headphones, Image, LayoutDashboard, LayoutGrid, LayoutTemplate, Megaphone,
  Monitor, Package, Palette, PlayCircle, ShoppingCart, Smartphone, Smile,
  Sparkles, Stethoscope, TrendingUp, Users, UtensilsCrossed, Wrench,
}

// Simple WordPress "W" glyph (lucide ships no brand icons).
function WordpressGlyph({ size = 24, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m5 8 3 9 2.5-6M12 8l3 9 2.5-8" />
    </svg>
  )
}

// Resolve an icon by name from the data layer, with a safe fallback.
export default function Icon({ name, size = 24, className, ...rest }) {
  if (name === "Wordpress") return <WordpressGlyph size={size} className={className} {...rest} />
  const Cmp = REGISTRY[name] || Box
  return <Cmp size={size} className={className} {...rest} />
}
