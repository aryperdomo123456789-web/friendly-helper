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
    <div className={cn("space-y-6 min-w-0 w-full overflow-x-hidden", className)}>
      {!hideHeader ? (
        <div className="border-b border-border/70 pb-3">
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {description}
            </p>
          ) : null}
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
