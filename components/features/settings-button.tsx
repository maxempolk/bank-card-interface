'use client'

import { useRouter } from 'next/navigation'
import { Settings } from 'lucide-react'

export function SettingsButton() {
  const router = useRouter()

  return (
    <div className="flex justify-end mb-2">
      <button
        onClick={() => router.push('/settings')}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
      >
        <Settings className="h-4 w-4" />
        Настройки
      </button>
    </div>
  )
}
