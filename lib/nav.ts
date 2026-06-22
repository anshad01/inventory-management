import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  FolderTree,
  Users,
  Share2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Primary navigation. Routes not yet built are marked and link to "#" so the
// shell renders the full intended IA (see SPEC.md §6.1) while we build screens
// incrementally.
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Purchase Orders", href: "/purchase-orders", icon: Truck },
  { label: "Sales", href: "/sales", icon: ShoppingCart },
  { label: "Suppliers", href: "/suppliers", icon: FolderTree },
  { label: "Share Links", href: "/share", icon: Share2 },
  { label: "Users", href: "/settings/users", icon: Users },
];
