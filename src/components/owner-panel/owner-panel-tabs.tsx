import { MessageSquare, Server, Settings, Share2, Users, Key } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const OWNER_PANEL_TABS = [
  { value: "acessos", label: "Acessos", icon: Users },
  { value: "servidores", label: "Servidores", icon: Server },
  { value: "configuracao", label: "Central", icon: Settings },
  { value: "suporte", label: "Suporte", icon: MessageSquare },
  { value: "planos", label: "Planos", icon: Key },
  { value: "referencia", label: "Indicação", icon: Share2 },
] as const;

type OwnerPanelTabsProps = {
  hasUnreadSupport?: boolean;
};

export function OwnerPanelTabs({ hasUnreadSupport }: OwnerPanelTabsProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-sidebar-border bg-sidebar/30 p-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
            Núcleo administrativo
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Acesso separado para operação, suporte, planos e configuração.
          </p>
        </div>
      </div>
      <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
        {OWNER_PANEL_TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="gap-2 rounded-full border border-sidebar-border/70 bg-sidebar-accent/30 px-4 py-2 data-[state=active]:border-primary/50 data-[state=active]:bg-primary/10"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.value === "suporte" && hasUnreadSupport ? (
              <span className={cn("h-2 w-2 rounded-full bg-destructive animate-pulse")} />
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
