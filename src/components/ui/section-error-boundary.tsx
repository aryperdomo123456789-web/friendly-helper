import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import { reportLovableError } from "@/lib/lovable-error-reporting";

type SectionErrorBoundaryProps = {
  children: ReactNode;
  title: string;
  description: string;
  resetKey?: string;
  className?: string;
};

type SectionErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportLovableError(error, {
      boundary: "section_error_boundary",
      title: this.props.title,
      description: this.props.description,
      componentStack: errorInfo.componentStack,
    });
  }

  componentDidUpdate(prevProps: SectionErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={this.props.className}>
          <div className="rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-2xl shadow-black/30">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Seção indisponível
            </div>
            <h3 className="mt-4 text-xl font-black text-white">{this.props.title}</h3>
            <p className="mt-2 text-sm text-neutral-400">{this.props.description}</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-widest text-neutral-500">Detalhe técnico</div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-neutral-200">
                {this.state.error?.message || "Erro sem mensagem disponível."}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
