import type { ElementType, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SectionErrorBoundary } from "@/components/ui/section-error-boundary";

type OwnerPageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ElementType;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function OwnerPageShell({
  eyebrow = "Núcleo administrativo",
  title,
  description,
  icon: Icon,
  rightSlot,
  children,
  className,
  contentClassName,
}: OwnerPageShellProps) {
  return (
    <div className={cn("space-y-6 min-w-0 w-full overflow-x-hidden", className)}>
      <Card className="relative overflow-hidden border-sidebar-border/80 bg-gradient-to-br from-sidebar via-card to-background shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>
        <CardContent className="relative z-10 p-3 lg:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                  {eyebrow}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                {Icon ? (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                ) : null}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {description}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            {rightSlot ? (
              <div className="shrink-0 self-start lg:ml-3 lg:max-w-[170px]">
                {rightSlot}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <SectionErrorBoundary
        title="Conteúdo administrativo indisponível"
        description="A estrutura do painel do dono permaneceu ativa, mas este bloco específico encontrou uma falha."
        resetKey={title}
        className={cn("space-y-6", contentClassName)}
      >
        {children}
      </SectionErrorBoundary>
    </div>
  );
}
