import type { ElementType, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type ContentEmptyStateProps = {
  icon?: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function ContentEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: ContentEmptyStateProps) {
  return (
    <section
      role="status"
      className={cn(
        "flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/70 px-5 py-10 text-center shadow-sm sm:min-h-60 sm:px-8",
        className,
      )}
    >
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">{title}</h2>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
