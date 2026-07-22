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
