import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionErrorBoundary } from "@/components/ui/section-error-boundary";

type UserPageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ElementType;
  rightSlot?: ReactNode;
  hideHeader?: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function UserPageShell({
  eyebrow,
  title,
  description,
  icon: Icon,
  rightSlot,
  hideHeader = false,
  children,
  className,
  contentClassName,
}: UserPageShellProps) {
  return (
    <div className={cn("w-full min-w-0 space-y-5 overflow-x-hidden", className)}>
      {!hideHeader ? (
        <div className="flex min-w-0 flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            ) : null}
            <div className="min-w-0">
              {eyebrow ? (
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary/80">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="truncate text-2xl font-black tracking-tight sm:text-4xl">{title}</h1>
              {description ? (
                <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {rightSlot ? <div className="shrink-0 sm:pt-1">{rightSlot}</div> : null}
        </div>
      ) : null}

      <SectionErrorBoundary
        title="Conteúdo do usuário indisponível"
        description="O shell visual permaneceu ativo, mas este bloco da página apresentou uma falha."
        resetKey={title}
        className={cn("space-y-6", contentClassName)}
      >
        {children}
      </SectionErrorBoundary>
    </div>
  );
}
