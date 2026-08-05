import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Painel IPTV</h1>
      <p className="mt-4 text-muted-foreground">Bem-vindo ao sistema de gerenciamento multi-servidor.</p>
    </div>
  )
}
