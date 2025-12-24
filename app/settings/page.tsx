"use client"

import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Settings, CreditCard, ArrowLeft } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()

  const handleChangeCard = () => {
    router.push("/?change-card=true")
  }

  const handleBack = () => {
    router.push("/")
  }

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Назад
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
          </div>
          <p className="text-muted-foreground">
            Управление параметрами вашего аккаунта
          </p>
        </div>

        <div className="space-y-4">
          <Card className="border border-border/50 bg-card shadow-sm">
            <button
              onClick={handleChangeCard}
              className="w-full p-6 text-left transition-colors hover:bg-accent/5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Сменить номер карты</h3>
                  <p className="text-sm text-muted-foreground">
                    Обновите привязанный номер банковской карты
                  </p>
                </div>
                <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
              </div>
            </button>
          </Card>
        </div>
      </div>
    </main>
  )
}
