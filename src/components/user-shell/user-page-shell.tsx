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
  title,
  description,
  hideHeader = false,
  children,
  className,
  contentClassName,
}: UserPageShellProps) {
  return (
    <div className={cn("min-w-0 w-full overflow-x-hidden", className)}>
      {!hideHeader ? (
        <div className="mb-3 flex items-center gap-2 border-b border-border/60 pb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">
            {title}
          </h1>
          {description ? (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      <SectionErrorBoundary
        title="Conteúdo do usuário indisponível"
        description="O shell visual permaneceu ativo, mas este bloco da página apresentou uma falha."
        resetKey={title}
        className={cn("min-w-0", contentClassName)}
      >
        {children}
      </SectionErrorBoundary>
    </div>
  );
}
