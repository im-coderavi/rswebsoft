import {
  LayoutDashboard,
  Package,
  Globe,
  Tags,
  Grid3x3,
  Building2,
  ShoppingCart,
  Users,
  Monitor,
  Mail,
  CreditCard,
} from "lucide-react"

// Single source of truth for admin navigation. AdminSidebar renders these
// sections directly; AdminLayout derives the topbar title from the same
// list, so a new section only needs to be added here once.
export const NAV_SECTIONS = [
  {
    label: "Overview",
    links: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Catalog",
    links: [
      { to: "/admin/products", label: "Products", icon: Package },
      { to: "/admin/delivered-websites", label: "Delivered Websites", icon: Globe },
      { to: "/admin/packages", label: "Packages & Pricing", icon: Tags },
      { to: "/admin/categories", label: "Categories", icon: Grid3x3 },
      { to: "/admin/brands", label: "Brands", icon: Building2 },
    ],
  },
  {
    label: "Sales",
    links: [
      { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { to: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    label: "Site Content",
    links: [
      { to: "/admin/demo-links", label: "Demo Center", icon: Monitor },
      { to: "/admin/subscribers", label: "Subscribers", icon: Mail },
    ],
  },
  {
    label: "Settings",
    links: [{ to: "/admin/settings", label: "Payment Settings", icon: CreditCard }],
  },
]

// Longest path first, so a nested route (e.g. /admin/products/new) matches
// its parent section instead of falling through to a shorter, wrong prefix.
export const ADMIN_TITLES = NAV_SECTIONS.flatMap((section) => section.links)
  .map((link) => ({ prefix: link.to, title: link.label }))
  .sort((a, b) => b.prefix.length - a.prefix.length)

// Delivered Websites and Packages & Pricing are just filtered views over the
// shared Product form (/admin/products/new, /admin/products/:id/edit). Both
// TypedProductList's "New"/"Edit" links carry a ?type= param so this can map
// back to the section the admin actually came from — otherwise the topbar
// title and sidebar highlight both fall back to "Products" on those routes,
// which reads as if the click had redirected away from the section entirely.
const TYPE_SECTION_PATH = {
  "delivered-website": "/admin/delivered-websites",
  package: "/admin/packages",
}

const PRODUCT_FORM_ROUTE = /^\/admin\/products\/(new|[^/]+\/edit)$/

export function resolveAdminPath(pathname, search) {
  if (PRODUCT_FORM_ROUTE.test(pathname)) {
    const type = new URLSearchParams(search).get("type")
    if (type && TYPE_SECTION_PATH[type]) return TYPE_SECTION_PATH[type]
  }
  return pathname
}
