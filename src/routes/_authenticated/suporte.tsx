import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { usePlayerSession } from "@/lib/player-store";
import {
  listSupportThreadsPage,
  listMySupportThreads,
  markThreadRead,
  getOrCreateThread,
  sendSupportMessage,
  sendSupportOwnerMessage,
  sendSupportAttachment,
  listSupportMessagesPage,
  closeSupportThread,
  respondToClosurePrompt,
  submitSupportSatisfaction,
  getSupportStats,
  updateSupportThreadOperations,
} from "@/lib/chat.functions";
import { getSupportMessageTypeMeta, inferSupportMessageType } from "@/lib/support-message.types";
import { getSupportStatusMeta } from "@/lib/chat-policy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  X,
  MessageSquare,
  Send,
  Image as ImageIcon,
  ShieldCheck,
  Star,
  Clock3,
  BadgeCheck,
  History,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserPageShell } from "@/components/user-shell/user-page-shell";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SupportPriority = "low" | "normal" | "high" | "urgent";
type SupportCategory =
  "general" | "access" | "billing" | "playback" | "catalog" | "technical" | "other";

export const Route = createFileRoute("/_authenticated/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte Técnico" },
      { name: "description", content: "Atendimento ao cliente em tempo real." },
    ],
  }),
  component: SuportePage,
});

function SuportePage() {
  const { isOwner, profile, authUserId } = usePlayerSession();
  const queryClient = useQueryClient();
  const fetchThreadsPage = useServerFn(listSupportThreadsPage);
  const fetchMyThreads = useServerFn(listMySupportThreads);
  const mutationMarkRead = useServerFn(markThreadRead);
  const fetchOrCreateThread = useServerFn(getOrCreateThread);
  const fetchSupportStats = useServerFn(getSupportStats);
  const [threadsPage, setThreadsPage] = useState(1);
  const threadsPageSize = 10;
  const [ownerView, setOwnerView] = useState<"atendimento" | "estatisticas">("atendimento");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerStatus, setOwnerStatus] = useState<
    "all" | "open" | "pending_support" | "pending_customer" | "closed"
  >("all");
  const [ownerPriority, setOwnerPriority] = useState<"all" | SupportPriority>("all");
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [mobilePane, setMobilePane] = useState<"threads" | "conversation">("threads");

  const threads = useQuery({
    queryKey: [
      "support-threads-page",
      threadsPage,
      threadsPageSize,
      ownerStatus,
      ownerPriority,
      ownerSearch,
    ],
    queryFn: () =>
      fetchThreadsPage({
        data: {
          page: threadsPage,
          page_size: threadsPageSize,
          ...(ownerStatus !== "all" ? { status: ownerStatus } : {}),
          ...(ownerPriority !== "all" ? { priority: ownerPriority } : {}),
          ...(ownerSearch.trim() ? { search: ownerSearch.trim() } : {}),
        },
      }),
    enabled: isOwner,
    refetchInterval: 10000,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    setThreadsPage(1);
  }, [ownerSearch, ownerStatus, ownerPriority]);

  const threadsTotal = threads.data?.total ?? 0;
  const threadsTotalPages = Math.max(1, Math.ceil(threadsTotal / threadsPageSize));
  const threadsSafePage = Math.min(threadsPage, threadsTotalPages);
  const threadsPaginationPages = useMemo(() => {
    const windowSize = 5;
    if (threadsTotalPages <= windowSize) {
      return Array.from({ length: threadsTotalPages }, (_, index) => index + 1);
    }
    const start = Math.max(1, Math.min(threadsSafePage - 2, threadsTotalPages - (windowSize - 1)));
    const end = Math.min(threadsTotalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [threadsSafePage, threadsTotalPages]);

  const effectiveUserId = profile?.id ?? authUserId ?? null;

  const userThreadQuery = useQuery({
    queryKey: ["support-thread-user", effectiveUserId],
    queryFn: () => fetchOrCreateThread({ data: { userId: effectiveUserId! } }),
    enabled: !!effectiveUserId && !isOwner,
  });

  const myThreadsQuery = useQuery({
    queryKey: ["support-my-threads", effectiveUserId],
    queryFn: () => fetchMyThreads(),
    enabled: !!effectiveUserId && !isOwner,
    placeholderData: (previous) => previous,
  });

  const statsQuery = useQuery({
    queryKey: ["support-stats"],
    queryFn: () => fetchSupportStats(),
    enabled: isOwner && ownerView === "estatisticas",
  });
  const supportStats = statsQuery.data;
  const satisfactionAverage = Number(supportStats?.satisfaction_average ?? 0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsCompactViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isCompactViewport) {
      setMobilePane("threads");
      return;
    }
    setMobilePane(selectedThread ? "conversation" : "threads");
  }, [isCompactViewport, selectedThread]);

  useEffect(() => {
    if (!isOwner) return;

    const channel = supabase
      .channel("support_threads_page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_threads",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOwner, queryClient]);

  const [selectedThread, setSelectedThread] = useState<any>(null);

  useEffect(() => {
    if (!isOwner && userThreadQuery.data) {
      setSelectedThread(userThreadQuery.data);
    }
  }, [userThreadQuery.data, isOwner]);

  if (!effectiveUserId && !isOwner) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-center">
        <div className="space-y-4">
          <MessageSquare className="mx-auto h-16 w-16 opacity-10" />
          <h1 className="text-xl font-bold">Carregando perfil...</h1>
        </div>
      </div>
    );
  }

  return (
    <UserPageShell
      title={isOwner ? "Suporte ao Vivo" : "Histórico de Suporte"}
      description=""
      icon={MessageSquare}
    >
      {isOwner ? (
        <div className="space-y-5">
          <Tabs
            value={ownerView}
            onValueChange={(value) => setOwnerView(value as typeof ownerView)}
          >
            <TabsList className="grid h-11 w-full max-w-xl grid-cols-2 bg-muted/40">
              <TabsTrigger value="atendimento" className="text-sm font-semibold">
                Atendimento
              </TabsTrigger>
              <TabsTrigger value="estatisticas" className="text-sm font-semibold">
                Estatísticas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {ownerView === "atendimento" ? (
            <div className="grid h-[min(75vh,720px)] min-h-[480px] grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
              <Card
                className={cn(
                  "flex flex-col overflow-hidden bg-sidebar/30 border-sidebar-border md:col-span-4",
                  isCompactViewport && mobilePane !== "threads" && "hidden",
                )}
              >
                <CardHeader className="py-4 border-b border-sidebar-border">
                  <div className="space-y-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" /> Conversas
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {threadsTotal === 0
                        ? "Nenhuma conversa ativa."
                        : `Página ${threadsSafePage} de ${threadsTotalPages}`}
                    </p>
                    <div className="space-y-2 pt-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={ownerSearch}
                          onChange={(event) => setOwnerSearch(event.target.value)}
                          placeholder="Buscar por protocolo"
                          className="h-9 pl-9 bg-background/60"
                          aria-label="Buscar conversa por protocolo"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={ownerStatus}
                          onValueChange={(value) => setOwnerStatus(value as typeof ownerStatus)}
                        >
                          <SelectTrigger aria-label="Filtrar por status">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os status</SelectItem>
                            <SelectItem value="pending_support">Aguardando suporte</SelectItem>
                            <SelectItem value="pending_customer">Aguardando cliente</SelectItem>
                            <SelectItem value="open">Aberto</SelectItem>
                            <SelectItem value="closed">Fechado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={ownerPriority}
                          onValueChange={(value) => setOwnerPriority(value as typeof ownerPriority)}
                        >
                          <SelectTrigger aria-label="Filtrar por prioridade">
                            <SelectValue placeholder="Prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas prioridades</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="low">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {threads.isLoading ? (
                    <div className="p-4 text-center">Carregando...</div>
                  ) : (threads.data?.items ?? []).length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm italic">
                      Nenhuma conversa ativa.
                    </div>
                  ) : (
                    threads.data?.items.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedThread(item);
                          setMobilePane("conversation");
                          mutationMarkRead({ data: { threadId: item.id, isOwner: true } });
                          queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
                        }}
                        data-tv-focus
                        className={cn(
                          "w-full p-4 text-left hover:bg-primary/10 border-b border-sidebar-border transition-all flex items-center justify-between group",
                          selectedThread?.id === item.id &&
                            "bg-primary/20 border-l-4 border-l-primary",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-bold truncate text-sm group-hover:text-primary transition-colors">
                              {item.profile?.display_name || item.profile?.username || "Usuário"}
                            </div>
                            <Badge
                              variant={item.status === "closed" ? "secondary" : "default"}
                              className="text-[9px] uppercase"
                            >
                              {getSupportStatusMeta(item.status).label}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate opacity-70">
                            {item.protocol ? `#${item.protocol} · ` : ""}
                            {item.last_message || "Iniciou uma conversa"}
                          </div>
                        </div>
                        {item.unread_count_owner > 0 && (
                          <span className="ml-2 bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                            {item.unread_count_owner}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
                {threadsTotalPages > 1 && (
                  <div className="border-t border-sidebar-border p-3">
                    <Pagination className="mx-0 w-full justify-start">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              setThreadsPage((current) => Math.max(1, current - 1));
                            }}
                            className={threadsSafePage <= 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {threadsPaginationPages.map((page) => (
                          <PaginationItem key={page}>
                            <Button
                              variant={page === threadsSafePage ? "default" : "ghost"}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setThreadsPage(page)}
                            >
                              {page}
                            </Button>
                          </PaginationItem>
                        ))}
                        {threadsTotalPages >
                          (threadsPaginationPages[threadsPaginationPages.length - 1] ??
                            threadsSafePage) && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              setThreadsPage((current) => Math.min(threadsTotalPages, current + 1));
                            }}
                            className={
                              threadsSafePage >= threadsTotalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </Card>

              <Card
                className={cn(
                  "flex flex-col overflow-hidden border-sidebar-border bg-sidebar/20 md:col-span-8",
                  isCompactViewport && mobilePane !== "conversation" && "hidden",
                )}
              >
                {selectedThread ? (
                  <ChatWindow
                    thread={selectedThread}
                    onClose={() => {
                      setSelectedThread(null);
                      setMobilePane("threads");
                    }}
                    isOwner={isOwner}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-sidebar-accent/50 flex items-center justify-center">
                      <MessageSquare className="h-10 w-10 opacity-20" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Central de Atendimento</p>
                      <p className="text-sm opacity-60">
                        Selecione um cliente ao lado para iniciar o suporte.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-4">
              <Card className="xl:col-span-1 border-sidebar-border bg-sidebar/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" /> Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Totais
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Aberto</p>
                        <p className="text-2xl font-black text-foreground">
                          {statsQuery.data?.open_threads ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fechado</p>
                        <p className="text-2xl font-black text-foreground">
                          {statsQuery.data?.closed_threads ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Satisfação
                    </p>
                    <p className="mt-2 text-3xl font-black text-primary">
                      {satisfactionAverage.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Base: {statsQuery.data?.satisfaction_count ?? 0} avaliação(ões)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-3 border-sidebar-border bg-sidebar/20">
                <CardHeader className="border-b border-sidebar-border">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5" /> Distribuição 1 a 5
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
                  {(
                    statsQuery.data?.distribution ??
                    [1, 2, 3, 4, 5].map((score) => ({ score, count: 0 }))
                  ).map((item: any) => (
                    <div
                      key={item.score}
                      className="rounded-2xl border border-border/70 bg-background/70 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                          Nota {item.score}
                        </p>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.count}
                        </Badge>
                      </div>
                      <p className="mt-3 text-3xl font-black">{item.count}</p>
                      <p className="text-xs text-muted-foreground">Resultados registrados</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="grid h-[min(75vh,720px)] min-h-[480px] grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
          <Card
            className={cn(
              "flex flex-col overflow-hidden bg-sidebar/30 border-sidebar-border md:col-span-4",
              isCompactViewport && mobilePane !== "threads" && "hidden",
            )}
          >
            <CardHeader className="py-4 border-b border-sidebar-border">
              <div className="space-y-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" /> Meu histórico
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {myThreadsQuery.isLoading
                    ? "Carregando histórico..."
                    : `${(myThreadsQuery.data ?? []).length} atendimento(s) encontrados`}
                </p>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {myThreadsQuery.isLoading ? (
                <div className="p-4 text-center">Carregando...</div>
              ) : (myThreadsQuery.data ?? []).length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm italic">
                  Nenhum atendimento encontrado.
                </div>
              ) : (
                (myThreadsQuery.data ?? []).map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedThread(item);
                      mutationMarkRead({ data: { threadId: item.id, isOwner: false } });
                    }}
                    data-tv-focus
                    className={cn(
                      "w-full p-4 text-left hover:bg-primary/10 border-b border-sidebar-border transition-all flex items-center justify-between group",
                      selectedThread?.id === item.id && "bg-primary/20 border-l-4 border-l-primary",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold truncate text-sm group-hover:text-primary transition-colors">
                          {item.protocol ? `#${item.protocol}` : "Atendimento"}
                        </div>
                        <Badge
                          variant={item.status === "closed" ? "secondary" : "default"}
                          className="text-[9px] uppercase"
                        >
                          {getSupportStatusMeta(item.status).label}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate opacity-70">
                        {item.last_message || "Sem mensagens"}
                      </div>
                    </div>
                    {typeof item.satisfaction_score === "number" && (
                      <span className="ml-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-200">
                        {item.satisfaction_score}/5
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card
            className={cn(
              "flex flex-col overflow-hidden border-sidebar-border bg-sidebar/20 md:col-span-8",
              isCompactViewport && mobilePane !== "conversation" && "hidden",
            )}
          >
            {selectedThread ? (
              <ChatWindow
                thread={selectedThread}
                onClose={() => {
                  setSelectedThread(null);
                  setMobilePane("threads");
                }}
                isOwner={isOwner}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-sidebar-accent/50 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 opacity-20" />
                </div>
                <div>
                  <p className="font-bold text-lg">Histórico de suporte</p>
                  <p className="text-sm opacity-60">
                    Selecione um protocolo para ver o atendimento completo.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </UserPageShell>
  );
}

function ChatWindow({
  thread,
  onClose,
  isOwner,
}: {
  thread: any;
  onClose: () => void;
  isOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const pendingMessageIdRef = useRef<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [threadStatus, setThreadStatus] = useState(thread.status ?? "open");
  const [threadPriority, setThreadPriority] = useState<SupportPriority>(
    thread.priority ?? "normal",
  );
  const [threadCategory, setThreadCategory] = useState<SupportCategory>(
    thread.category ?? "general",
  );
  const [threadSatisfaction, setThreadSatisfaction] = useState<number | null>(
    thread.satisfaction_score ?? null,
  );
  const [messagesPage, setMessagesPage] = useState(1);
  const messagesPageSize = 25;
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchMessagesPage = useServerFn(listSupportMessagesPage);
  const mutationSendSupport = useServerFn(sendSupportMessage);
  const mutationSendOwnerSupport = useServerFn(sendSupportOwnerMessage);
  const mutationSendAttachment = useServerFn(sendSupportAttachment);
  const mutationUpdateThreadOperations = useServerFn(updateSupportThreadOperations);
  const mutationCloseThread = useServerFn(closeSupportThread);
  const mutationRespondClosePrompt = useServerFn(respondToClosurePrompt);
  const mutationSubmitSatisfaction = useServerFn(submitSupportSatisfaction);
  const [closeConfirm, setCloseConfirm] = useState(false);

  useEffect(() => {
    setThreadStatus(thread.status ?? "open");
    setThreadPriority(thread.priority ?? "normal");
    setThreadCategory(thread.category ?? "general");
    setThreadSatisfaction(thread.satisfaction_score ?? null);
  }, [thread.id, thread.status, thread.priority, thread.category, thread.satisfaction_score]);

  const messagesQuery = useQuery({
    queryKey: ["support-messages-page", thread.id, messagesPage, messagesPageSize],
    queryFn: () =>
      fetchMessagesPage({
        data: {
          threadId: thread.id,
          page: messagesPage,
          page_size: messagesPageSize,
        },
      }),
    placeholderData: (previous) => previous,
  });

  const messagesTotal = messagesQuery.data?.total ?? 0;
  const messagesTotalPages = Math.max(1, Math.ceil(messagesTotal / messagesPageSize));
  const messagesSafePage = Math.min(messagesPage, messagesTotalPages);
  const messagesPaginationPages = useMemo(() => {
    const windowSize = 5;
    if (messagesTotalPages <= windowSize) {
      return Array.from({ length: messagesTotalPages }, (_, index) => index + 1);
    }
    const start = Math.max(
      1,
      Math.min(messagesSafePage - 2, messagesTotalPages - (windowSize - 1)),
    );
    const end = Math.min(messagesTotalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [messagesSafePage, messagesTotalPages]);

  useEffect(() => {
    setMessagesPage(1);
  }, [thread.id]);

  useEffect(() => {
    setMessages(messagesQuery.data?.items ?? []);
  }, [messagesQuery.data, thread.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`thread_owner:${thread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          if (messagesPage === 1) {
            setMessages((prev) => {
              if (prev.some((m) => m["id"] === payload.new["id"])) return prev;
              return [...prev, payload.new];
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread.id, messagesPage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const executeSend = async (messageToSend: string) => {
    if (!messageToSend.trim()) return;

    setSending(true);
    const clientMessageId = pendingMessageIdRef.current ?? crypto.randomUUID();
    pendingMessageIdRef.current = clientMessageId;

    try {
      if (isOwner) {
        const msgData = await mutationSendOwnerSupport({
          data: {
            threadId: thread.id,
            content: messageToSend,
            clientMessageId,
          },
        });
        if (msgData) {
          setMessages((prev) =>
            prev.some((message) => message.id === msgData.id) ? prev : [...prev, msgData],
          );
        }
      } else {
        const result = await mutationSendSupport({
          data: { content: messageToSend, clientMessageId },
        });

        if (result?.userMessage) {
          setMessages((prev) =>
            prev.some((message) => message.id === result.userMessage.id)
              ? prev
              : [...prev, result.userMessage],
          );
        }
        if (result?.autoReply) {
          setMessages((prev) =>
            prev.some((message) => message.id === result.autoReply.id)
              ? prev
              : [...prev, result.autoReply],
          );
        }
      }
      pendingMessageIdRef.current = null;
      setNewMessage("");
      setMessagesPage(1);
      queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
      queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
      queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
      toast.success("Mensagem enviada!");
    } catch (err: any) {
      toast.error("Erro ao enviar: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCloseThread = async () => {
    setClosing(true);
    try {
      await mutationCloseThread({
        data: {
          threadId: thread.id,
          closedByRole: isOwner ? "owner" : "client",
        },
      });
      queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
      queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
      queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
      toast.success("Atendimento encerrado com sucesso.");
      setThreadStatus("closed");
    } catch (err: any) {
      toast.error("Erro ao encerrar: " + err.message);
    } finally {
      setClosing(false);
      setCloseConfirm(false);
    }
  };

  const handleKeepOpen = async () => {
    try {
      await mutationRespondClosePrompt({
        data: {
          threadId: thread.id,
          keepOpen: true,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
      queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
      queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
      toast.success("Atendimento mantido em aberto.");
      setThreadStatus("open");
    } catch (err: any) {
      toast.error("Erro ao responder: " + err.message);
    }
  };

  const handleOperationUpdate = async (input: {
    priority?: SupportPriority;
    category?: SupportCategory;
  }) => {
    const previous = { priority: threadPriority, category: threadCategory };
    if (input.priority) setThreadPriority(input.priority);
    if (input.category) setThreadCategory(input.category);

    try {
      await mutationUpdateThreadOperations({
        data: {
          threadId: thread.id,
          ...input,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
      toast.success("Dados operacionais atualizados.");
    } catch (err: any) {
      setThreadPriority(previous.priority);
      setThreadCategory(previous.category);
      toast.error("Erro ao atualizar atendimento: " + err.message);
    }
  };

  const handleSatisfaction = async (score: number) => {
    setClosing(true);
    try {
      await mutationSubmitSatisfaction({
        data: {
          threadId: thread.id,
          score,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
      queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
      toast.success(`Avaliação registrada: ${score}/5.`);
      setThreadSatisfaction(score);
    } catch (err: any) {
      toast.error("Erro ao registrar avaliação: " + err.message);
    } finally {
      setClosing(false);
    }
  };

  const handleSend = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const formValue = e?.currentTarget ? new FormData(e.currentTarget).get("message") : null;
    const messageToSend = (typeof formValue === "string" ? formValue : newMessage).trim();
    if (!messageToSend) return;
    await executeSend(messageToSend);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("audio/")
        ? "audio"
        : null;
    if (!fileType) {
      toast.error("Envie somente imagem ou áudio.");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10 MB.");
      e.target.value = "";
      return;
    }

    setSending(true);
    try {
      const fileExt =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 8) || "bin";
      const filePath = `chat/${thread.id}/${crypto.randomUUID()}.${fileExt}`;
      const clientMessageId = crypto.randomUUID();
      const { error: uploadError } = await supabase.storage
        .from("chat-files-v2")
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const message = await mutationSendAttachment({
        data: {
          threadId: thread.id,
          path: filePath,
          fileType,
          clientMessageId,
        },
      });
      setMessages((prev) =>
        prev.some((item) => item.id === message.id) ? prev : [...prev, message],
      );
      queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
      queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
      queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
      toast.success("Arquivo enviado!");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      e.target.value = "";
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between bg-sidebar/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black shadow-inner">
            {(thread.profile?.display_name || thread.profile?.username || "S")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight flex flex-wrap items-center gap-2">
              {thread.profile?.display_name || thread.profile?.username || "Suporte Central"}
              {thread.protocol && (
                <span className="text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                  #{thread.protocol}
                </span>
              )}
              <Badge
                variant={threadStatus === "closed" ? "secondary" : "default"}
                className="text-[9px] uppercase"
              >
                {getSupportStatusMeta(threadStatus).label}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-online/20 bg-online/10 px-2.5 py-1 text-online">
                <span className="h-2 w-2 rounded-full bg-online animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                {getSupportStatusMeta(threadStatus).description}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1">
                Histórico preservado
              </span>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground leading-relaxed max-w-xl">
              Chat contínuo para suporte do cliente, com histórico, confirmação de envio e
              identificação por protocolo.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <div className="hidden items-center gap-2 lg:flex">
              <Select
                value={threadPriority}
                onValueChange={(value) =>
                  void handleOperationUpdate({ priority: value as SupportPriority })
                }
              >
                <SelectTrigger className="w-[132px]" aria-label="Prioridade da conversa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={threadCategory}
                onValueChange={(value) =>
                  void handleOperationUpdate({ category: value as SupportCategory })
                }
              >
                <SelectTrigger className="w-[132px]" aria-label="Categoria da conversa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="access">Acesso</SelectItem>
                  <SelectItem value="billing">Financeiro</SelectItem>
                  <SelectItem value="playback">Player</SelectItem>
                  <SelectItem value="catalog">Catálogo</SelectItem>
                  <SelectItem value="technical">Técnico</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {isOwner && threadStatus !== "closed" && (
            <Button
              type="button"
              variant="outline"
              className="border-rose-500/30 text-rose-200 hover:bg-rose-500/10"
              onClick={() => setCloseConfirm(true)}
            >
              Encerrar
            </Button>
          )}
          <Button
            data-tv-focus
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Voltar para conversas"
            title="Voltar para conversas"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        <div className="flex flex-col gap-3 rounded-2xl border border-sidebar-border/60 bg-sidebar/40 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-muted-foreground">
            {messagesTotal === 0 ? (
              "Nenhuma mensagem nesta conversa."
            ) : (
              <>
                Página <span className="font-semibold text-foreground">{messagesSafePage}</span> de{" "}
                <span className="font-semibold text-foreground">{messagesTotalPages}</span>
              </>
            )}
          </div>
          {messagesTotalPages > 1 && (
            <Pagination className="mx-0 w-auto justify-start lg:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setMessagesPage((current) => Math.max(1, current - 1));
                    }}
                    className={messagesSafePage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {messagesPaginationPages.map((page) => (
                  <PaginationItem key={page}>
                    <Button
                      variant={page === messagesSafePage ? "default" : "ghost"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setMessagesPage(page)}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                ))}
                {messagesTotalPages >
                  (messagesPaginationPages[messagesPaginationPages.length - 1] ??
                    messagesSafePage) && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setMessagesPage((current) => Math.min(messagesTotalPages, current + 1));
                    }}
                    className={
                      messagesSafePage >= messagesTotalPages ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>

        {messagesQuery.isLoading ? (
          <div className="rounded-2xl border border-sidebar-border/60 bg-sidebar/30 p-6 text-center text-sm text-muted-foreground">
            Carregando mensagens...
          </div>
        ) : null}

        {messages.map((msg) => {
          const isMe = isOwner
            ? msg.sender_id !== thread.user_id
            : msg.sender_id === thread.user_id;
          const messageType = inferSupportMessageType(msg, thread.user_id);
          const messageMeta = getSupportMessageTypeMeta(messageType);
          const isClosePrompt = messageType === "closure_prompt";
          const isSatisfactionPrompt = messageType === "satisfaction_prompt";
          const scoreValue = threadSatisfaction;
          return (
            <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all hover:shadow-lg",
                  isMe
                    ? "bg-primary text-primary-foreground rounded-tr-none border border-primary/20"
                    : "bg-sidebar-accent/80 border border-sidebar-border rounded-tl-none backdrop-blur-sm",
                )}
              >
                {messageType !== "user_message" && (
                  <div className="mb-2 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]",
                        messageMeta.className,
                      )}
                    >
                      {messageMeta.label}
                    </span>
                  </div>
                )}
                {isClosePrompt ? (
                  <div className="space-y-3">
                    <p className="leading-relaxed">{msg.content}</p>
                    {!isOwner && threadStatus === "open" && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          onClick={() => void handleCloseThread()}
                          disabled={closing}
                        >
                          Sim, encerrar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void handleKeepOpen()}
                          disabled={closing}
                        >
                          Não, manter aberto
                        </Button>
                      </div>
                    )}
                  </div>
                ) : isSatisfactionPrompt ? (
                  <div className="space-y-3">
                    <p className="leading-relaxed">{msg.content}</p>
                    {!isOwner && !threadSatisfaction ? (
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <Button
                            key={score}
                            type="button"
                            variant={score >= 4 ? "default" : "outline"}
                            className="h-10"
                            onClick={() => void handleSatisfaction(score)}
                            disabled={closing}
                          >
                            {score}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {scoreValue
                          ? `Avaliação registrada: ${scoreValue}/5`
                          : "Aguardando avaliação."}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {msg.file_url ? (
                      <div className="space-y-2 py-1">
                        {msg.file_type === "image" ? (
                          <img
                            src={msg.file_url}
                            alt="Imagem"
                            className="max-w-full rounded-lg cursor-zoom-in border border-white/10"
                            onClick={() => window.open(msg.file_url)}
                          />
                        ) : msg.file_type === "audio" ? (
                          <audio
                            controls
                            src={msg.file_url}
                            className="w-full max-w-[240px] h-10"
                          />
                        ) : (
                          <a
                            href={msg.file_url}
                            target="_blank"
                            className="flex items-center gap-2 font-bold underline decoration-primary/50"
                          >
                            <ImageIcon className="h-4 w-4" /> Abrir Arquivo
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="leading-relaxed">{msg.content}</p>
                    )}
                  </>
                )}
                <div
                  className={cn(
                    "text-[9px] mt-1 font-bold opacity-50",
                    isMe ? "text-right" : "text-left",
                  )}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {threadStatus === "closed" ? (
        <div className="border-t border-sidebar-border bg-sidebar/60 p-4">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-online" />
              <p className="font-semibold">Atendimento encerrado.</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Este protocolo permanece no histórico. Para abrir um novo atendimento, volte ao início
              e envie uma nova mensagem.
            </p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-sidebar-border bg-sidebar/60 backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,audio/*"
            />
            <Button
              data-tv-focus
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Input
              name="message"
              autoComplete="off"
              placeholder={isOwner ? "Responder ao cliente..." : "Descreva sua solicitação..."}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                pendingMessageIdRef.current = null;
              }}
              className="flex-1 bg-sidebar-accent/30 border-sidebar-border focus-visible:ring-primary h-11 rounded-xl shadow-inner"
              data-tv-focus
              enterKeyHint="send"
            />
            <Button
              data-tv-focus
              type="submit"
              size="icon"
              className="h-11 w-11 rounded-full shadow-lg"
              disabled={sending || !newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      <Dialog open={closeConfirm} onOpenChange={(open) => !open && setCloseConfirm(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Encerrar atendimento</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja fechar este protocolo e iniciar a etapa de satisfação?
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-muted-foreground">
            O cliente receberá a confirmação de encerramento e a campanha de avaliação 1 a 5.
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCloseConfirm(false)}
              disabled={closing}
            >
              Não, voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleCloseThread()}
              disabled={closing}
            >
              {closing ? "Encerrando..." : "Sim, encerrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
