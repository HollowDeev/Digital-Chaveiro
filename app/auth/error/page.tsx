"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Card className="w-full max-w-md border-0 shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-gray-900/80">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Erro de Autenticação</CardTitle>
            <CardDescription className="mt-2">Ocorreu um erro ao processar sua autenticação</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">Voltar para o Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
