"use client"

// Hook de compatibilidade — delega para o PermissoesContext global.
// Mantém a mesma interface pública para não quebrar código existente.
export type { NivelAcesso } from "@/lib/contexts/permissoes-context"
export { usePermissoesContext as usePermissoes } from "@/lib/contexts/permissoes-context"

