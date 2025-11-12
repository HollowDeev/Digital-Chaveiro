import type { ReactNode } from "react"
import { MobileMenu } from "./mobile-menu"

type PageHeaderProps = {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
}

export function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <div className="glass-effect sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 lg:px-8 lg:py-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <MobileMenu />

        {icon && (
          <div className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 sm:flex lg:h-11 lg:w-11">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-foreground lg:text-xl">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
