"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wrench,
  Users,
  UserCircle,
  Wallet,
  FileText,
  Receipt,
  Sparkles,
  Settings,
  TrendingUp,
} from "lucide-react"
import ThemeToggle from "./theme-toggle"

const navItems = [
  { href: "/pdv", label: "PDV", icon: Receipt },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/funcionarios", label: "Funcionários", icon: UserCircle },
  { href: "/caixa", label: "Caixa", icon: Wallet },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/graficos", label: "Gráficos", icon: TrendingUp },
  { href: "/configuracao", label: "Configurações", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-sidebar-border bg-sidebar lg:block">
      <div className="flex h-full flex-col">
        <div className="relative border-b border-sidebar-border bg-gradient-to-br from-primary/5 to-accent/5 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground">ChaveSmart</h1>
              <p className="text-xs text-muted-foreground">Gestão Inteligente</p>
            </div>
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
          <div className="mb-3 px-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu Principal</p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                )}
                <Icon className="relative h-5 w-5" />
                <span className="relative">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border bg-gradient-to-br from-accent/5 to-transparent p-4">
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <p className="text-xs font-medium text-muted-foreground">Sistema Online</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
