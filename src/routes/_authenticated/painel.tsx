import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { 
  listServers, 
  saveServer, 
  deleteServer, 
  listAccessUsersPage, 
  createAccessUser, 
  updateAccessUser, 
  deleteAccessUser,
  kickDevices,
  testServerConnection,
  listAdminAuditLogsPage,
} from "@/lib/owner.functions";
import { Badge } from "@/components/ui/badge";
import {
  listTestLinksPage,
  saveTestLink,
  deleteTestLink
} from "@/lib/test-links.functions";
import { usePlayerSession } from "@/lib/player-store";
import { getAdminAppConfig, updateAppConfig } from "@/lib/config.functions";
import { getPlans, getPlansPage, savePlan, deletePlan } from "@/lib/plans.functions";
import {
  listSupportThreadsPage,
  markThreadRead,
  listSupportMessagesPage,
  sendSupportOwnerMessage,
  sendSupportAttachment,
} from "@/lib/chat.functions";
import {
  getSupportMessageTypeMeta,
  inferSupportMessageType,
} from "@/lib/support-message.types";
import { isAttachmentWithinLimit, isValidAttachmentType } from "@/lib/chat-policy";
import { sanitizeAdminAuditDetails, type AdminAuditDetails } from "@/lib/admin-audit";

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs, 
  TabsContent, 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { 
  Plus, 
  Settings, 
  Users, 
  Server, 
  Trash2, 
  Edit, 
  Wifi, 
  WifiOff, 
  ShieldAlert,
  Calendar,
  Key,
  Copy,
  MessageSquare,
  Share2,
  X,
  Send,
  Image as ImageIcon,
  Bell,
  Loader2,
  RefreshCw,
  GripVertical,
  ScrollText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { portalName } from "@/lib/portal-name";
import { proxyMediaUrl } from "@/lib/media-url";
import { copyToClipboard } from "@/lib/clipboard";
import { sendMassNotification } from "@/lib/notifications.functions";
import { OwnerPanelTabs } from "@/components/owner-panel/owner-panel-tabs";
import { OwnerPageShell } from "@/components/owner-shell/owner-page-shell";
import { reorderServers, refreshServerCache } from "@/lib/owner.functions";
import { APP_CONFIG_QUERY_KEY, getAppConfig } from "@/lib/config.functions";


export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel do dono" },
      { name: "description", content: "Gerenciamento de servidores e acessos de usuários." },
    ],
  }),
  component: PainelDono,
});

function formatAuditDetails(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "—";
  const scalarDetails = Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) =>
        item === null ||
        typeof item === "boolean" ||
        typeof item === "number" ||
        typeof item === "string",
    ),
  ) as AdminAuditDetails;
  const sanitized = sanitizeAdminAuditDetails(scalarDetails);
  return Object.keys(sanitized).length > 0 ? JSON.stringify(sanitized) : "—";
}

function PainelDono() {
  const { isOwner } = usePlayerSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("acessos");
  const [usersSearch, setUsersSearch] = useState("");
  const [debouncedUsersSearch, setDebouncedUsersSearch] = useState("");
  const [usersPageSize, setUsersPageSize] = useState<10 | 25 | 50 | 100>(10);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [plansCurrentPage, setPlansCurrentPage] = useState(1);
  const [testLinksCurrentPage, setTestLinksCurrentPage] = useState(1);
  const [threadsPage, setThreadsPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const threadsPageSize = 10;
  const auditPageSize = 10;

  // Server functions
  const fetchServers = useServerFn(listServers);
  const fetchUsersPage = useServerFn(listAccessUsersPage);
  const mutationSaveServer = useServerFn(saveServer);
  const mutationDeleteServer = useServerFn(deleteServer);
  const mutationRefreshServerCache = useServerFn(refreshServerCache);
  const mutationReorderServers = useServerFn(reorderServers);
  const mutationCreateUser = useServerFn(createAccessUser);
  const mutationUpdateUser = useServerFn(updateAccessUser);
  const mutationDeleteUser = useServerFn(deleteAccessUser);
  const mutationKick = useServerFn(kickDevices);
  const mutationTest = useServerFn(testServerConnection);
  const fetchConfig = useServerFn(getAdminAppConfig);
  const mutationSaveConfig = useServerFn(updateAppConfig);
  const fetchTestLinksPage = useServerFn(listTestLinksPage);
  const mutationSaveTestLink = useServerFn(saveTestLink);
  const mutationDeleteTestLink = useServerFn(deleteTestLink);
  const mutationMassNotif = useServerFn(sendMassNotification);
  const fetchPlans = useServerFn(getPlans);
  const fetchPlansPage = useServerFn(getPlansPage);
  const mutationSavePlan = useServerFn(savePlan);
  const mutationDeletePlan = useServerFn(deletePlan);
  const fetchThreadsPage = useServerFn(listSupportThreadsPage);
  const mutationMarkRead = useServerFn(markThreadRead);
  const fetchAuditPage = useServerFn(listAdminAuditLogsPage);

  const threads = useQuery({
    queryKey: ["support-threads-page", threadsPage, threadsPageSize],
    queryFn: () =>
      fetchThreadsPage({
        data: {
          page: threadsPage,
          page_size: threadsPageSize,
        },
      }),
    enabled: isOwner,
    refetchInterval: 10000,
    placeholderData: (previous) => previous,
  });

  const threadsTotal = threads.data?.total ?? 0;
  const threadsTotalPages = Math.max(1, Math.ceil(threadsTotal / threadsPageSize));
  const threadsSafePage = Math.min(threadsPage, threadsTotalPages);
  const threadsItems = threads.data?.items ?? [];
  const threadsPaginationPages = useMemo(() => {
    const windowSize = 5;
    if (threadsTotalPages <= windowSize) {
      return Array.from({ length: threadsTotalPages }, (_, index) => index + 1);
    }
    const start = Math.max(1, Math.min(threadsSafePage - 2, threadsTotalPages - (windowSize - 1)));
    const end = Math.min(threadsTotalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [threadsSafePage, threadsTotalPages]);

  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [copyingLinkId, setCopyingLinkId] = useState<string | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifContent, setNotifContent] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [showNotifDialog, setShowNotifDialog] = useState(false);
  const [showConfigSaveConfirm, setShowConfigSaveConfirm] = useState(false);
  const configFormRef = useRef<HTMLFormElement>(null);
  const [saveConfirm, setSaveConfirm] = useState<null | {
    kind: "server" | "user" | "testLink" | "plan";
    title: string;
    description: string;
  }>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [serverItems, setServerItems] = useState<any[]>([]);
  const [draggingServerId, setDraggingServerId] = useState<string | null>(null);
  const [dragOverServerId, setDragOverServerId] = useState<string | null>(null);
  const [refreshingServerId, setRefreshingServerId] = useState<string | null>(null);
  const [refreshStageByServerId, setRefreshStageByServerId] = useState<Record<string, "validando" | "baixando" | "concluido" | "falha">>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const refreshTimersRef = useRef<Record<string, number | undefined>>({});
  const nextServerSortOrder = serverItems.reduce(
    (max, server) => Math.max(max, Number(server.sort_order) || 0),
    -1,
  ) + 1;

  const auditLogs = useQuery({
    queryKey: ["admin-audit-page", auditPage, auditPageSize],
    queryFn: () =>
      fetchAuditPage({
        data: {
          page: auditPage,
          page_size: auditPageSize,
        },
      }),
    enabled: isOwner,
    placeholderData: (previous) => previous,
  });

  const auditTotal = auditLogs.data?.total ?? 0;
  const auditTotalPages = Math.max(1, Math.ceil(auditTotal / auditPageSize));
  const auditSafePage = Math.min(auditPage, auditTotalPages);
  const auditItems = auditLogs.data?.items ?? [];
  const auditPaginationPages = useMemo(() => {
    const windowSize = 5;
    if (auditTotalPages <= windowSize) {
      return Array.from({ length: auditTotalPages }, (_, index) => index + 1);
    }
    const start = Math.max(1, Math.min(auditSafePage - 2, auditTotalPages - (windowSize - 1)));
    const end = Math.min(auditTotalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [auditSafePage, auditTotalPages]);

  const plans = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => fetchPlans(),
    enabled: isOwner,
  });

  const plansPage = useQuery({
    queryKey: ["admin-plans-page", plansCurrentPage],
    queryFn: () =>
      fetchPlansPage({
        data: {
          page: plansCurrentPage,
          page_size: 6,
        },
      }),
    enabled: isOwner,
    placeholderData: (previous) => previous,
  });

  const testLinksPage = useQuery({
    queryKey: ["admin-test-links-page", testLinksCurrentPage],
    queryFn: () =>
      fetchTestLinksPage({
        data: {
          page: testLinksCurrentPage,
          page_size: 10,
        },
      }),
    enabled: isOwner,
    placeholderData: (previous) => previous,
  });

  const configQuery = useQuery({
    queryKey: APP_CONFIG_QUERY_KEY,
    queryFn: () => fetchConfig(),
    enabled: isOwner,
  });

  const servers = useQuery({
    queryKey: ["admin-servers"],
    queryFn: () => fetchServers(),
    enabled: isOwner,
  });

  useEffect(() => {
    setServerItems(servers.data ?? []);
  }, [servers.data]);

  useEffect(() => {
    return () => {
      Object.values(refreshTimersRef.current).forEach((timer) => {
        if (timer) window.clearTimeout(timer);
      });
      refreshTimersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedUsersSearch(usersSearch.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [usersSearch]);

  useEffect(() => {
    setUsersCurrentPage(1);
  }, [debouncedUsersSearch, usersPageSize]);

  const users = useQuery({
    queryKey: ["admin-users-page", debouncedUsersSearch, usersCurrentPage, usersPageSize],
    queryFn: () =>
      fetchUsersPage({
        data: {
          search: debouncedUsersSearch,
          status: "all",
          server_id: null,
          plan_id: null,
          referral: "all",
          sort_order: "newest",
          page: usersCurrentPage,
          page_size: usersPageSize,
        },
      }),
    enabled: isOwner,
    placeholderData: (previous) => previous,
  });

  const usersTotal = users.data?.total ?? 0;
  const usersTotalPages = Math.max(1, Math.ceil(usersTotal / usersPageSize));
  const usersSafePage = Math.min(usersCurrentPage, usersTotalPages);
  const usersPageStart = usersTotal === 0 ? 0 : (usersSafePage - 1) * usersPageSize + 1;
  const usersPageEnd = Math.min(usersSafePage * usersPageSize, usersTotal);
  const usersItems = users.data?.items ?? [];
  const usersPaginationPages = useMemo(() => {
    const windowSize = 5;
    if (usersTotalPages <= windowSize) {
      return Array.from({ length: usersTotalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, Math.min(usersSafePage - 2, usersTotalPages - (windowSize - 1)));
    const end = Math.min(usersTotalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [usersSafePage, usersTotalPages]);

  const plansTotal = plansPage.data?.total ?? 0;
  const plansTotalPages = Math.max(1, Math.ceil(plansTotal / 6));
  const plansSafePage = Math.min(plansCurrentPage, plansTotalPages);
  const plansItems = plansPage.data?.items ?? [];
  const plansPaginationPages = useMemo(() => {
    const windowSize = 5;
    if (plansTotalPages <= windowSize) {
      return Array.from({ length: plansTotalPages }, (_, index) => index + 1);
    }
    const start = Math.max(1, Math.min(plansSafePage - 2, plansTotalPages - (windowSize - 1)));
    const end = Math.min(plansTotalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [plansSafePage, plansTotalPages]);

  const testLinksTotal = testLinksPage.data?.total ?? 0;
  const testLinksTotalPages = Math.max(1, Math.ceil(testLinksTotal / 10));
  const testLinksSafePage = Math.min(testLinksCurrentPage, testLinksTotalPages);
  const testLinksItems = testLinksPage.data?.items ?? [];
  const testLinksPaginationPages = useMemo(() => {
    const windowSize = 5;
    if (testLinksTotalPages <= windowSize) {
      return Array.from({ length: testLinksTotalPages }, (_, index) => index + 1);
    }
    const start = Math.max(1, Math.min(testLinksSafePage - 2, testLinksTotalPages - (windowSize - 1)));
    const end = Math.min(testLinksTotalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [testLinksSafePage, testLinksTotalPages]);


  // State for modals
  const [serverModal, setServerModal] = useState<any>(null);
  const [serverCreateSeed, setServerCreateSeed] = useState(0);
  const [userModal, setUserModal] = useState<any>(null);
  const [userCreateSeed, setUserCreateSeed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testLinkModal, setTestLinkModal] = useState<any>(null);
  const [testLinkCreateSeed, setTestLinkCreateSeed] = useState(0);
  const [planModal, setPlanModal] = useState<any>(null);
  const [planCreateSeed, setPlanCreateSeed] = useState(0);
  const openServerModal = (server?: any) => {
    if (!server) {
      const seed = Date.now();
      setServerCreateSeed(seed);
      setServerModal({
        name: portalName(nextServerSortOrder),
        owner_note: "",
        can_edit_owner_note: true,
        credentials: [{ username: "", password: "", dns: "" }],
        is_active: true,
        sort_order: nextServerSortOrder,
        connection_capacity: null,
        bulk_action: "none",
        __draft_seed: seed,
      });
      return;
    }

    const currentCredential = server.credentials?.[0] ?? null;

    setServerModal({
      ...server,
      name: portalName(Number(server.sort_order) || 0),
      credentials: [
        {
          username: currentCredential?.username ?? "",
          password: currentCredential?.password ?? "",
          dns: currentCredential?.dns ?? server.url ?? "",
        },
      ],
      bulk_action: "none",
      __draft_seed: server.id,
    });
  };

  /* ------------------- Handlers Servidores ------------------- */
  const handleSaveServer = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSaveServer();
  };

  const executeSaveServer = async () => {
    setLoading(true);
    try {
      await mutationSaveServer({ data: serverModal });
      toast.success("Servidor salvo com sucesso.");
      setServerModal(null);
      setSaveConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
      queryClient.invalidateQueries({ queryKey: ["player-session"] });
    } catch (err: any) {
      toast.error(`Falha ao salvar o servidor: ${err.message || "erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este servidor?")) return;
    try {
      await mutationDeleteServer({ data: { id } });
      toast.success("Servidor removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
      queryClient.invalidateQueries({ queryKey: ["player-session"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir servidor");
    }
  };

  const clearRefreshTimers = useCallback((id: string) => {
    const timer = refreshTimersRef.current[id];
    if (timer) {
      window.clearTimeout(timer);
    }
    delete refreshTimersRef.current[id];
  }, []);

  const setRefreshStage = useCallback((id: string, stage: "validando" | "baixando" | "concluido" | "falha") => {
    setRefreshStageByServerId((current) => ({ ...current, [id]: stage }));
  }, []);

  const handleRefreshServerCache = async (id: string, name: string) => {
    clearRefreshTimers(id);
    setRefreshingServerId(id);
    setRefreshStage(id, "validando");
    refreshTimersRef.current[id] = window.setTimeout(() => {
      setRefreshStageByServerId((current) => (current[id] === "validando" ? { ...current, [id]: "baixando" } : current));
    }, 450);

    try {
      const result = await mutationRefreshServerCache({ data: { id, clear_local_before_fetch: true } });
      clearRefreshTimers(id);
      setRefreshStage(id, "concluido");
      toast.success(
        result.source === "m3u"
          ? `Portal ${name} validado e recarregado com M3U local.`
          : `Portal ${name} validado com fallback Xtream e cache atualizado.`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
      queryClient.invalidateQueries({ queryKey: ["player-session"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      queryClient.invalidateQueries({ queryKey: ["series-info"] });
      queryClient.invalidateQueries({ queryKey: ["epg"] });
      refreshTimersRef.current[id] = window.setTimeout(() => {
        setRefreshStageByServerId((current) => {
          if (current[id] !== "concluido") return current;
          const next = { ...current };
          delete next[id];
          return next;
        });
        delete refreshTimersRef.current[id];
      }, 1600);
    } catch (err: any) {
      clearRefreshTimers(id);
      setRefreshStage(id, "falha");
      toast.error(err.message || "Erro ao recarregar cache do servidor");
      refreshTimersRef.current[id] = window.setTimeout(() => {
        setRefreshStageByServerId((current) => {
          if (current[id] !== "falha") return current;
          const next = { ...current };
          delete next[id];
          return next;
        });
        delete refreshTimersRef.current[id];
      }, 2400);
    } finally {
      setRefreshingServerId((current) => (current === id ? null : current));
    }
  };

  const handleServerOrderChange = async (targetServerId: string) => {
    if (!draggingServerId || draggingServerId === targetServerId) return;

    const previousServers = serverItems;
    const fromIndex = previousServers.findIndex((server) => server.id === draggingServerId);
    const toIndex = previousServers.findIndex((server) => server.id === targetServerId);

    if (fromIndex < 0 || toIndex < 0) return;

    const nextServers = [...previousServers];
    const [moved] = nextServers.splice(fromIndex, 1);
    nextServers.splice(toIndex, 0, moved);
    const normalizedServers = nextServers.map((server, index) => ({
      ...server,
      name: portalName(index),
      sort_order: index,
    }));

    setServerItems(normalizedServers);
    setDraggingServerId(null);
    setDragOverServerId(null);

    try {
      await mutationReorderServers({ data: { ids: normalizedServers.map((server) => server.id) } });
      toast.success("Ordem dos servidores atualizada");
      queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
      queryClient.invalidateQueries({ queryKey: ["player-session"] });
    } catch (err: any) {
      setServerItems(previousServers);
      toast.error(err.message || "Erro ao reordenar servidores");
    }
  };

  /* ------------------- Handlers Usuarios ------------------- */
  const requestSaveUserConfirmation = () => {
    setSaveConfirm({
      kind: "user",
      title: userModal?.id ? "Confirmar atualização do acesso" : "Confirmar criação do acesso",
      description: userModal?.id
        ? "Você tem certeza que deseja salvar as alterações deste usuário?"
        : "Você tem certeza que deseja criar este novo acesso?",
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    requestSaveUserConfirmation();
  };

  const executeSaveUser = async () => {
    setLoading(true);
    try {
      if (userModal.id) {
        await mutationUpdateUser({ data: userModal });
        toast.success("Acesso atualizado com sucesso.");
      } else {
        await mutationCreateUser({ data: userModal });
        toast.success("Novo acesso criado com sucesso.");
      }
      setUserModal(null);
      setSaveConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
    } catch (err: any) {
      toast.error(`Falha ao salvar o usuário: ${err.message || "erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveConfirm({
      kind: "testLink",
      title: testLinkModal?.id ? "Confirmar atualização do link" : "Confirmar criação do link",
      description: testLinkModal?.id
        ? "Você tem certeza que deseja salvar as alterações deste link de teste?"
        : "Você tem certeza que deseja criar este novo link de teste?",
    });
  };

  const executeSaveTestLink = async () => {
    setLoading(true);
    try {
      await mutationSaveTestLink({ data: testLinkModal });
      toast.success("Link de teste salvo com sucesso.");
      setTestLinkModal(null);
      setSaveConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["admin-test-links"] });
      queryClient.invalidateQueries({ queryKey: ["admin-test-links-page"] });
    } catch (err: any) {
      toast.error(`Falha ao salvar o link de teste: ${err.message || "erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTestLink = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este link de teste?")) return;
    try {
      await mutationDeleteTestLink({ data: { id } });
      toast.success("Link removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-test-links"] });
      queryClient.invalidateQueries({ queryKey: ["admin-test-links-page"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir link");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza de que deseja remover este acesso? O usuário será desconectado.")) return;
    try {
      await mutationDeleteUser({ data: { id } });
      toast.success("Acesso removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir usuário");
    }
  };
  
  /* ------------------- Handlers Planos ------------------- */
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveConfirm({
      kind: "plan",
      title: planModal?.id ? "Confirmar atualização do plano" : "Confirmar criação do plano",
      description: planModal?.id
        ? "Você tem certeza que deseja salvar as alterações deste plano?"
        : "Você tem certeza que deseja criar este novo plano?",
    });
  };

  const executeSavePlan = async () => {
    setLoading(true);
    try {
      await mutationSavePlan({ data: planModal });
      toast.success("Plano salvo com sucesso.");
      setPlanModal(null);
      setSaveConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-plans-page"] });
      // Re-invalidate users because plans affect them
      queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
    } catch (err: any) {
      toast.error(`Falha ao salvar o plano: ${err.message || "erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;
    try {
      await mutationDeletePlan({ data: { id } });
      toast.success("Plano removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-plans-page"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir plano");
    }
  };

  const confirmSaveAction = async () => {
    if (!saveConfirm) return;

    switch (saveConfirm.kind) {
      case "server":
        await executeSaveServer();
        return;
      case "user":
        await executeSaveUser();
        return;
      case "testLink":
        await executeSaveTestLink();
        return;
      case "plan":
        await executeSavePlan();
        return;
      default:
        return;
    }
  };

  const handleSaveConfig = async () => {
    const form = configFormRef.current;
    if (!form) {
      toast.error("Não foi possível localizar o formulário da configuração central.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData(form);
      const values = Object.fromEntries(data.entries());
      const newConfig = {
        ...configQuery.data,
        name: values["name"] as string,
        short_name: values["short_name"] as string,
        domain: values["domain"] as string,
        base_url: values["base_url"] as string,
        logo_url: values["logo_url"] as string,
        logo_small_url: values["logo_small_url"] as string,
        favicon_url: values["favicon_url"] as string,
        tmdb_api_key: (values["tmdb_api_key"] as string) || undefined,
        epg_xmltv_url: (values["epg_xmltv_url"] as string) || undefined,
        theme_mode: values["theme_mode"] as "azul" | "dark" | "light",
        telegram_handle: values["telegram_handle"] as string,
        mp_access_token: values["mp_access_token"] as string,
        mp_public_key: values["mp_public_key"] as string,
        mp_webhook_secret: values["mp_webhook_secret"] as string,
        mp_enabled: values["mp_enabled"] === "on",
        theme: {
          ...configQuery.data?.theme,
          primary: values["primary"] as string,
          bg: values["bg"] as string,
        },
        support_attendant_name: values["support_attendant_name"] as string,
        support_auto_reply: values["support_auto_reply"] as string,
        copy: {
          ...configQuery.data?.copy,
          home_title: values["home_title"] as string,
        },
      };

      await mutationSaveConfig({ data: newConfig });
      toast.success("Configuração salva com sucesso.");
      await queryClient.invalidateQueries({ queryKey: APP_CONFIG_QUERY_KEY });
      await configQuery.refetch();
      setShowConfigSaveConfirm(false);
    } catch (err: any) {
      toast.error(`Falha ao salvar a configuração: ${err?.message || "erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  };


  if (!isOwner) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h1 className="text-xl font-bold">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">
          Somente o dono do sistema pode cadastrar, editar ou excluir servidores.
        </p>
      </div>
    );
  }

  return (
    <OwnerPageShell
      className="mx-auto max-w-7xl pb-20"
      title="Painel do dono"
      description="Concentre servidores, planos, suporte e configuração global em um núcleo visual próprio, mais limpo e profissional."
      icon={ShieldAlert}
      rightSlot={
        <div className="w-full max-w-[140px] rounded-xl border border-sidebar-border/70 bg-background/60 px-2.5 py-2 text-[10px] leading-snug shadow-sm">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-muted-foreground">Admin</p>
          <p className="mt-0.5 truncate font-semibold text-foreground">Operação central</p>
        </div>
      }
    >
      <Card className="border-sidebar-border bg-sidebar/25">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Núcleo administrativo
              </p>
              <h1 className="text-3xl font-bold tracking-tight">Painel do dono</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Esta área concentra controles internos de operação. O fluxo do usuário comum permanece separado,
                com acesso ao catálogo, conta e suporte sem exposição das ferramentas administrativas.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-sidebar-border bg-background/50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Acessos
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Usuários, permissões e ciclo de acesso.</p>
              </div>
              <div className="rounded-2xl border border-sidebar-border bg-background/50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  <Server className="h-4 w-4 text-primary" />
                  Servidores
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Fonte IPTV, credenciais e ordem operacional.</p>
              </div>
              <div className="rounded-2xl border border-sidebar-border bg-background/50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  <Settings className="h-4 w-4 text-primary" />
                  Central
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Marca, textos globais e configuração principal.</p>
              </div>
              <div className="rounded-2xl border border-sidebar-border bg-background/50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Suporte
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Conversas, comprovantes e resposta interna.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-muted-foreground">Configurações e operação</h2>
          <p className="text-muted-foreground">Gerencie sua estrutura multi-servidor e seus clientes.</p>
        </div>
        <Dialog open={showNotifDialog} onOpenChange={setShowNotifDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-bold gap-2">
              <Bell className="h-4 w-4" /> Enviar Mensagem em Massa
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-sidebar border-sidebar-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Bell className="text-primary h-5 w-5" /> Notificação Global
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Título da Mensagem</Label>
                <Input
                  name="mass_notif_title"
                  autoComplete="off"
                  placeholder="Ex: Manutenção Programada"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="bg-background/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Conteúdo</Label>
                <textarea
                  name="mass_notif_content"
                  autoComplete="off"
                  placeholder="Descreva a mensagem que todos os usuários receberão..."
                  value={notifContent}
                  onChange={(e) => setNotifContent(e.target.value)}
                  className="w-full min-h-[120px] rounded-xl bg-background/40 border border-border p-3 text-sm focus:ring-primary"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowNotifDialog(false)}
                className="font-bold"
              >
                Cancelar
              </Button>
              <Button
                disabled={sendingNotif || !notifTitle || !notifContent}
                onClick={async () => {
                  setSendingNotif(true);
                  try {
                    const res = await mutationMassNotif({ data: { title: notifTitle, content: notifContent } });
                    toast.success(`Notificação enviada para ${res.count} usuários!`);
                    setShowNotifDialog(false);
                    setNotifTitle("");
                    setNotifContent("");
                  } catch (err: any) {
                    toast.error("Erro ao enviar: " + err.message);
                  } finally {
                    setSendingNotif(false);
                  }
                }}
                className="font-bold gap-2"
              >
                {sendingNotif ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Disparar Notificação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <OwnerPanelTabs hasUnreadSupport={threadsItems.some((t: any) => t.unread_count_owner > 0)} />


        <TabsContent value="acessos" className="space-y-4">
          <Card className="border-sidebar-border bg-sidebar/20">
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    Núcleo de acessos
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight">Usuários do sistema</h2>
                  <p className="text-sm text-muted-foreground">
                    Crie, edite e revise acessos com paginação server-side, mantendo a tela leve mesmo em bases grandes.
                  </p>
                </div>
                <Button onClick={() => {
                  const testPlan = plans.data?.find((p: any) => p.name.toLowerCase().includes("teste") || Number(p.price) === 0);
                  setUserCreateSeed(Date.now());
                  setUserModal({
                    username: "",
                    password: "",
                    display_name: "",
                    max_connections: testPlan?.max_connections ?? 1,
                    server_ids: [],
                    is_active: true,
                    plan_id: testPlan?.id || null,
                    expires_at: testPlan
                      ? new Date(Date.now() + testPlan.duration_value * (testPlan.duration_unit === 'minutes' ? 60 * 1000 : testPlan.duration_unit === 'hours' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString()
                      : null
                  });
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Criar acesso
                </Button>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.4fr,0.6fr]">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Buscar</Label>
                  <Input
                    placeholder="Username ou nome..."
                    value={usersSearch}
                    onChange={(event) => setUsersSearch(event.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Linhas por página</Label>
                    <Select
                      value={String(usersPageSize)}
                      onValueChange={(value) => setUsersPageSize(Number(value) as typeof usersPageSize)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 25, 50, 100].map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Resultado</Label>
                    <div className="flex h-9 items-center rounded-md border border-border bg-background/60 px-3 text-sm">
                      {usersPageStart === 0 ? "Nenhum usuário" : `${usersPageStart} - ${usersPageEnd} de ${usersTotal}`}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                   <TableHead>Referência</TableHead>
                  <TableHead>Servidores</TableHead>
                  <TableHead className="text-center">Conexões</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.isLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground uppercase tracking-widest">Carregando...</TableCell></TableRow>
                ) : usersItems.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground uppercase tracking-widest">Nenhum usuário encontrado.</TableCell></TableRow>
                ) : (
                  usersItems.map((user: any) => (
                    (() => {
                      const isProtectedOwner = user.username === "magodono";
                      return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {user.display_name || user.username}
                          {user.plan_id && (
                            <div className="flex flex-col">
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full border uppercase font-bold w-fit",
                                plans.data?.find((p: any) => p.id === user.plan_id)?.name.toLowerCase().includes("teste") 
                                  ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                                  : "bg-primary/20 text-primary border-primary/30"
                              )}>
                                {plans.data?.find((p: any) => p.id === user.plan_id)?.name || "Plano"}
                              </span>
                              <span className="text-[9px] text-muted-foreground mt-0.5">
                                R$ {Number(plans.data?.find((p: any) => p.id === user.plan_id)?.price || 0).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </TableCell>
                      <TableCell>
                        {user.referred_by ? (
                          <div className="text-xs font-bold text-primary">
                            @{user.referred_by.username}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Direto</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.server_ids.length} sv(s)
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          user.online > 0 ? "bg-online/10 text-online" : "bg-muted text-muted-foreground"
                        )}>
                          {user.online} / {user.max_connections}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {user.expires_at ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.expires_at).toLocaleDateString("pt-BR")}
                          </div>
                        ) : "Sem limite"}
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <span className="flex items-center gap-1.5 text-xs text-online">
                            <Wifi className="h-3 w-3" /> Ativo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-destructive">
                            <WifiOff className="h-3 w-3" /> Bloqueado
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setUserModal(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!isProtectedOwner ? (
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="text-muted-foreground/40 cursor-not-allowed" title="O dono não pode ser apagado" disabled>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                      );
                    })()
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

          {usersTotalPages > 1 && (
            <Card className="border-sidebar-border bg-sidebar/20">
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Página <span className="font-semibold text-foreground">{usersSafePage}</span> de{" "}
                  <span className="font-semibold text-foreground">{usersTotalPages}</span>
                </div>
                <Pagination className="mx-0 w-auto justify-start md:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setUsersCurrentPage((current) => Math.max(1, current - 1));
                        }}
                        className={usersSafePage <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {usersPaginationPages.map((page) => (
                      <PaginationItem key={page}>
                        <Button
                          variant={page === usersSafePage ? "default" : "ghost"}
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setUsersCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </PaginationItem>
                    ))}
                    {usersTotalPages > usersPaginationPages[usersPaginationPages.length - 1] && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setUsersCurrentPage((current) => Math.min(usersTotalPages, current + 1));
                        }}
                        className={usersSafePage >= usersTotalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="servidores" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Fontes de IPTV</h2>
            <Button onClick={() => openServerModal()}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Servidor
            </Button>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/30 p-3 text-xs text-muted-foreground">
            Arraste o ícone ao lado do nome para definir a ordem do primeiro, segundo e demais servidores.
          </div>

          {servers.isLoading ? (
            <div className="rounded-xl border border-border/40 bg-card/30 p-8 text-center text-muted-foreground">
              Carregando servidores...
            </div>
          ) : serverItems.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/30 p-8 text-center text-muted-foreground">
              Nenhum servidor cadastrado.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {serverItems.map((server: any, index: number) => {
                const isDragging = draggingServerId === server.id;
                const isDropTarget = dragOverServerId === server.id;
                const refreshStage = refreshStageByServerId[server.id] ?? null;
                return (
                  <Card
                    key={server.id}
                    className={cn(
                      "transition-all",
                      isDragging && "opacity-50 scale-[0.98]",
                      isDropTarget && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverServerId(server.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverServerId === server.id) setDragOverServerId(null);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleServerOrderChange(server.id);
                    }}
                    >
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData("text/plain", server.id);
                              setDraggingServerId(server.id);
                              setDragOverServerId(server.id);
                            }}
                            onDragEnd={() => {
                              setDraggingServerId(null);
                              setDragOverServerId(null);
                            }}
                            className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-md border border-border/60 bg-background/40 text-muted-foreground transition hover:text-foreground active:cursor-grabbing"
                            aria-label={`Arrastar ${portalName(index)}`}
                            title="Arrastar para reordenar"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <CardTitle className="truncate text-sm font-bold uppercase tracking-wider">
                            {portalName(index)}
                          </CardTitle>
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          Posição {index + 1}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRefreshServerCache(server.id, portalName(index))}
                          disabled={refreshingServerId === server.id}
                          title={
                            refreshStage
                              ? refreshStage === "validando"
                                ? "Validando M3U..."
                                : refreshStage === "baixando"
                                  ? "Baixando M3U..."
                                  : refreshStage === "concluido"
                                    ? "Concluído"
                                    : "Falha ao recarregar"
                              : "Recarregar M3U / Cache"
                          }
                        >
                          {refreshingServerId === server.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Server className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-1 truncate text-xs text-muted-foreground">
                        Credenciais protegidas no servidor
                      </div>
                      <div className="mb-4 text-xs text-muted-foreground">
                        Capacidade: {server.connection_capacity ? `${server.connection_capacity} conexões` : "não definida"}
                      </div>
                      {refreshStage ? (
                        <div className="mb-4 flex items-center gap-2">
                          <Badge
                            variant={refreshStage === "falha" ? "destructive" : "secondary"}
                            className={cn(
                              "px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em]",
                              refreshStage === "concluido" && "border-primary/30 bg-primary/10 text-primary",
                              refreshStage === "validando" && "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
                              refreshStage === "baixando" && "border-sky-500/30 bg-sky-500/10 text-sky-500",
                            )}
                          >
                            {refreshStage === "validando"
                              ? "Validando"
                              : refreshStage === "baixando"
                                ? "Baixando"
                                : refreshStage === "concluido"
                                  ? "Concluído"
                                  : "Falha"}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {refreshStage === "validando"
                              ? "Conferindo o portal e preparando a leitura."
                              : refreshStage === "baixando"
                                ? "M3U sendo baixada e organizada por este servidor."
                                : refreshStage === "concluido"
                                  ? "Cache pronto e isolado para este portal."
                                  : "O portal respondeu com erro ou conteúdo inválido."}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between items-center">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", server.is_active ? "bg-online/10 text-online" : "bg-destructive/10 text-destructive")}>
                          {server.is_active ? "Ativo" : "Inativo"}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openServerModal(server)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteServer(server.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="testes" className="space-y-4">
          <Card className="border-sidebar-border bg-sidebar/20">
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">Núcleo de indicação</p>
                  <h2 className="text-2xl font-bold tracking-tight">Links de Indicação (Teste Grátis)</h2>
                  <p className="text-sm text-muted-foreground">
                    Visual mais premium com paginação server-side para não carregar tudo de uma vez.
                  </p>
                </div>
                <Button onClick={() => setTestLinkModal({ 
                  slug: "", 
                  duration_minutes: 240,
                  max_connections: 1,
                  is_active: true
                }) || setTestLinkCreateSeed(Date.now())}>
                  <Plus className="mr-2 h-4 w-4" /> Novo Link
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {testLinksTotal === 0 ? (
                  "Nenhum link de teste criado."
                ) : (
                  <>
                    Página <span className="font-semibold text-foreground">{testLinksSafePage}</span> de{" "}
                    <span className="font-semibold text-foreground">{testLinksTotalPages}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificador (Slug)</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Conexões</TableHead>
                    <TableHead>Bônus</TableHead>
                    <TableHead>URL Pública</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testLinksPage.isLoading ? (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center">Carregando...</TableCell></TableRow>
                  ) : testLinksItems.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center">Nenhum link de teste criado.</TableCell></TableRow>
                  ) : (
                    testLinksItems.map((link: any) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">{link.slug}</TableCell>
                        <TableCell>
                          {Math.floor(link.duration_minutes / 60)}h {link.duration_minutes % 60}m
                        </TableCell>
                        <TableCell>{link.max_connections}</TableCell>
                        <TableCell>
                          <div className="text-xs leading-5 text-muted-foreground">
                            <div>
                              Mensal: <span className="font-semibold text-foreground">{link.bonus_days_monthly ?? 15} dias</span>
                            </div>
                            <div>
                              Trimestral+: <span className="font-semibold text-foreground">{link.bonus_days_quarterly ?? 30} dias</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                              /teste/{link.slug}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              type="button"
                              disabled={copyingLinkId === link.id}
                              onClick={async () => {
                                const url = `${window.location.origin}/teste/${link.slug}`;
                                setCopyingLinkId(link.id);
                                const ok = await copyToClipboard(url);
                                if (ok) toast.success("URL copiada com sucesso!");
                                else toast.error("Não foi possível copiar a URL.");
                                setCopyingLinkId((current) => (current === link.id ? null : current));
                              }}
                            >
                              <Copy className="h-3.3 w-3.3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            link.is_active ? "bg-online/10 text-online" : "bg-destructive/10 text-destructive"
                          )}>
                            {link.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setTestLinkModal(link)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTestLink(link.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {testLinksTotalPages > 1 && (
            <Card className="border-sidebar-border bg-sidebar/20">
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Página <span className="font-semibold text-foreground">{testLinksSafePage}</span> de{" "}
                  <span className="font-semibold text-foreground">{testLinksTotalPages}</span>
                </div>
                <Pagination className="mx-0 w-auto justify-start md:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setTestLinksCurrentPage((current) => Math.max(1, current - 1));
                        }}
                        className={testLinksSafePage <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {testLinksPaginationPages.map((page) => (
                      <PaginationItem key={page}>
                        <Button
                          variant={page === testLinksSafePage ? "default" : "ghost"}
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setTestLinksCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </PaginationItem>
                    ))}
                    {testLinksTotalPages > testLinksPaginationPages[testLinksPaginationPages.length - 1] && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setTestLinksCurrentPage((current) => Math.min(testLinksTotalPages, current + 1));
                        }}
                        className={testLinksSafePage >= testLinksTotalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          )}
        </TabsContent>


        <TabsContent value="configuracao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração Central do Sistema</CardTitle>
              <CardDescription>Gerencie identidade, temas e textos globais do sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              {configQuery.isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Carregando configurações...</div>
              ) : (
                <form
                  ref={configFormRef}
                  className="grid gap-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Site</Label>
                      <Input name="name" defaultValue={configQuery.data?.name} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome Curto</Label>
                      <Input name="short_name" defaultValue={configQuery.data?.short_name} />
                    </div>
                    <div className="space-y-2">
                      <Label>Domínio Principal</Label>
                      <Input name="domain" defaultValue={configQuery.data?.domain} />
                    </div>
                    <div className="space-y-2">
                      <Label>URL Base (DNS Cliente)</Label>
                      <Input name="base_url" defaultValue={configQuery.data?.base_url} />
                    </div>
                    <div className="space-y-2">
                      <Label>TMDB API Key (v3 auth)</Label>
                      <Input name="tmdb_api_key" placeholder="Insira sua chave TMDB para posters/sinopses extras" defaultValue={configQuery.data?.tmdb_api_key} />
                    </div>
                    <div className="space-y-2">
                      <Label>XMLTV EPG URL (ddns.net/epg.xml)</Label>
                      <Input name="epg_xmltv_url" placeholder="URL para guia de programação externo" defaultValue={configQuery.data?.epg_xmltv_url} />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3">Identidade Visual (Logos & Icones)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Logo Principal (URL)</Label>
                        <Input name="logo_url" placeholder="https://exemplo.com/logo.png" defaultValue={configQuery.data?.logo_url} />
                        {configQuery.data?.logo_url ? (
                          <div className="rounded-lg border border-border bg-background/60 p-2">
                            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Preview</div>
                            <img
                              src={proxyMediaUrl(configQuery.data.logo_url) ?? configQuery.data.logo_url}
                              alt="Preview logo principal"
                              className="max-h-20 w-auto object-contain"
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label>Logo Miniatura (URL)</Label>
                        <Input name="logo_small_url" placeholder="https://exemplo.com/logo-small.png" defaultValue={configQuery.data?.logo_small_url} />
                        {configQuery.data?.logo_small_url ? (
                          <div className="rounded-lg border border-border bg-background/60 p-2">
                            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Preview</div>
                            <img
                              src={proxyMediaUrl(configQuery.data.logo_small_url) ?? configQuery.data.logo_small_url}
                              alt="Preview logo miniatura"
                              className="max-h-16 w-auto object-contain"
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label>Favicon / Ícone (URL)</Label>
                        <Input name="favicon_url" placeholder="https://exemplo.com/favicon.ico" defaultValue={configQuery.data?.favicon_url} />
                        {configQuery.data?.favicon_url ? (
                          <div className="rounded-lg border border-border bg-background/60 p-2">
                            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Preview</div>
                            <img
                              src={proxyMediaUrl(configQuery.data.favicon_url) ?? configQuery.data.favicon_url}
                              alt="Preview favicon"
                              className="max-h-10 w-auto object-contain"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3">Temas & Estilo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Tema do Sistema</Label>
                        <Select name="theme_mode" defaultValue={configQuery.data?.theme_mode || "azul"}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o tema" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="azul">Azul (Clássico)</SelectItem>
                            <SelectItem value="dark">Preto e Branco (Dark)</SelectItem>
                            <SelectItem value="light">Branco e Preto (Light)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cor Primária</Label>
                        <div className="flex gap-2">
                          <Input name="primary" type="color" className="w-12 p-1 h-10" defaultValue={configQuery.data?.theme?.primary} />
                          <Input defaultValue={configQuery.data?.theme?.primary} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cor de Fundo</Label>
                        <div className="flex gap-2">
                          <Input name="bg" type="color" className="w-12 p-1 h-10" defaultValue={configQuery.data?.theme?.bg} />
                          <Input defaultValue={configQuery.data?.theme?.bg} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Título Home</Label>
                        <Input name="home_title" defaultValue={configQuery.data?.copy?.home_title} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3">Configuração Mercado Pago</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Access Token (MP)</Label>
                        <Input name="mp_access_token" type="password" defaultValue={configQuery.data?.mp_access_token} placeholder="APP_USR-..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Public Key (MP)</Label>
                        <Input name="mp_public_key" defaultValue={configQuery.data?.mp_public_key} placeholder="APP_USR-..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Webhook Secret (opcional)</Label>
                        <Input
                          name="mp_webhook_secret"
                          type="password"
                          defaultValue={configQuery.data?.mp_webhook_secret}
                          placeholder="Secret da assinatura do webhook"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          name="mp_enabled"
                          defaultChecked={configQuery.data?.mp_enabled}
                          id="mp-enabled"
                          className="rounded border-border bg-sidebar-accent"
                        />
                        <Label htmlFor="mp-enabled">Habilitar Pagamentos Automáticos</Label>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      URL de Webhook para configurar no Mercado Pago: <code className="bg-muted px-1 rounded">{configQuery.data?.base_url}/api/public/mercadopago-webhook</code>
                    </p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3">Configuração de Suporte</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Atendente</Label>
                        <Input 
                          name="support_attendant_name" 
                          defaultValue={configQuery.data?.support_attendant_name} 
                          placeholder="Ex: Suporte Mago" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mensagem de Resposta Automática</Label>
                        <Input 
                          name="support_auto_reply" 
                          defaultValue={configQuery.data?.support_auto_reply} 
                          placeholder="Olá! Recebemos sua mensagem..." 
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      * A resposta automática é enviada apenas na primeira mensagem do dia de cada cliente.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3">Rodapé & Telegram</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>@ do Telegram</Label>
                        <Input
                          name="telegram_handle"
                          defaultValue={configQuery.data?.telegram_handle}
                          placeholder="@contato"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Esse @ aparece no rodapé público e vira link direto para o Telegram.
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowConfigSaveConfirm(true)}
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
          <Dialog open={showConfigSaveConfirm} onOpenChange={setShowConfigSaveConfirm}>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>Confirmar salvamento</DialogTitle>
                <DialogDescription>
                  Você tem certeza que deseja salvar estas alterações na Central do Sistema?
                  Esta ação aplica as mudanças globais imediatamente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfigSaveConfirm(false)}
                  disabled={loading}
                >
                  Não, voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSaveConfig()}
                  disabled={loading}
                >
                  Sim, salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={!!saveConfirm} onOpenChange={(open) => !open && setSaveConfirm(null)}>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>{saveConfirm?.title ?? "Confirmar salvamento"}</DialogTitle>
                <DialogDescription>
                  {saveConfirm?.description ?? "Você tem certeza que deseja salvar estas alterações?"}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSaveConfirm(null)}
                  disabled={loading}
                >
                  Não, voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => void confirmSaveAction()}
                  disabled={loading}
                >
                  Sim, salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="suporte" className="h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
            <Card className="md:col-span-4 flex flex-col overflow-hidden bg-sidebar/30 border-sidebar-border">
              <CardHeader className="py-4 border-b border-sidebar-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Conversas
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {threadsTotal === 0 ? "Nenhuma conversa ativa." : `Página ${threadsSafePage} de ${threadsTotalPages}`}
                </p>
              </CardHeader>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {threads.isLoading ? (
                  <div className="p-4 text-center">Carregando...</div>
                ) : threadsItems.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm italic">Nenhuma conversa ativa.</div>
                ) : (
                  threadsItems.map((thread: any) => (
                    <button
                      key={thread.id}
                      onClick={async () => {
                        setSelectedThread(thread);
                        await mutationMarkRead({ data: { threadId: thread.id, isOwner: true } });
                        queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
                      }}
                      className={cn(
                        "w-full p-4 text-left hover:bg-primary/10 border-b border-sidebar-border transition-all flex items-center justify-between group",
                        selectedThread?.id === thread.id && "bg-primary/20 border-l-4 border-l-primary"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate text-sm group-hover:text-primary transition-colors">
                          {thread.profile?.display_name || thread.profile?.username || "Usuário"}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate opacity-70">
                          {thread.last_message || "Iniciou uma conversa"}
                        </div>
                      </div>
                      {thread.unread_count_owner > 0 && (
                        <span className="ml-2 bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                          {thread.unread_count_owner}
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
                      {threadsTotalPages > threadsPaginationPages[threadsPaginationPages.length - 1] && (
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
                          className={threadsSafePage >= threadsTotalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </Card>

            <Card className="md:col-span-8 flex flex-col overflow-hidden border-sidebar-border bg-sidebar/20">
              {selectedThread ? (
                <ChatWindow 
                  thread={selectedThread} 
                  onClose={() => setSelectedThread(null)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-sidebar-accent/50 flex items-center justify-center">
                    <MessageSquare className="h-10 w-10 opacity-20" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Central de Atendimento</p>
                    <p className="text-sm opacity-60">Selecione um cliente para iniciar o suporte.</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planos" className="space-y-4">
          <Card className="border-sidebar-border bg-sidebar/20">
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">Núcleo comercial</p>
                  <h2 className="text-2xl font-bold tracking-tight">Planos de Assinatura</h2>
                  <p className="text-sm text-muted-foreground">
                    Catálogo paginado para manter a tela leve e facilitar a operação do dono.
                  </p>
                </div>
                <Button onClick={() => {
                  setPlanCreateSeed(Date.now());
                  setPlanModal({ 
                  name: "", 
                  price: 30, 
                  duration_value: 30, 
                  duration_unit: "days", 
                  max_connections: 1 
                });
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Novo Plano
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {plansTotal === 0 ? (
                  "Nenhum plano cadastrado."
                ) : (
                  <>
                    Página <span className="font-semibold text-foreground">{plansSafePage}</span> de{" "}
                    <span className="font-semibold text-foreground">{plansTotalPages}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.isLoading ? (
              <div className="col-span-full p-8 text-center text-muted-foreground">Carregando planos...</div>
            ) : plansItems.length === 0 ? (
              <div className="col-span-full p-8 text-center text-muted-foreground">Nenhum plano cadastrado.</div>
            ) : (
              plansItems.map((plan: any) => (
                <Card key={plan.id} className="relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPlanModal(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePlan(plan.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{plan.name}</span>
                    </CardTitle>
                    <div className="text-2xl font-bold text-primary">
                      R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> {plan.duration_value} {plan.duration_unit === 'minutes' ? 'minutos' : plan.duration_unit === 'hours' ? 'horas' : 'dias'} de acesso
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" /> {plan.max_connections} conexão(ões)
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {plansTotalPages > 1 && (
            <Card className="border-sidebar-border bg-sidebar/20">
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Página <span className="font-semibold text-foreground">{plansSafePage}</span> de{" "}
                  <span className="font-semibold text-foreground">{plansTotalPages}</span>
                </div>
                <Pagination className="mx-0 w-auto justify-start md:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPlansCurrentPage((current) => Math.max(1, current - 1));
                        }}
                        className={plansSafePage <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {plansPaginationPages.map((page) => (
                      <PaginationItem key={page}>
                        <Button
                          variant={page === plansSafePage ? "default" : "ghost"}
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setPlansCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </PaginationItem>
                    ))}
                    {plansTotalPages > plansPaginationPages[plansPaginationPages.length - 1] && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPlansCurrentPage((current) => Math.min(plansTotalPages, current + 1));
                        }}
                        className={plansSafePage >= plansTotalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="referencia" className="space-y-4">
          <Card className="border-sidebar-border bg-sidebar/20">
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">Núcleo de indicação</p>
                  <h2 className="text-2xl font-bold tracking-tight">Links de Indicação / Teste</h2>
                  <p className="text-sm text-muted-foreground">
                    Catálogo de links com paginação server-side para manter a tela leve.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const testPlan = plans.data?.find((p: any) => p.name.toLowerCase().includes("teste") || Number(p.price) === 0);
                    setTestLinkCreateSeed(Date.now());
                    setTestLinkModal({
                      slug: "",
                      duration_minutes: testPlan ? (testPlan.duration_unit === "minutes" ? testPlan.duration_value : testPlan.duration_unit === "hours" ? testPlan.duration_value * 60 : testPlan.duration_value * 1440) : 360,
                      max_connections: testPlan?.max_connections ?? 1,
                      is_active: true,
                      description: "",
                      owner_only: false,
                      allow_repeat_device: false,
                      bonus_days_monthly: 15,
                      bonus_days_quarterly: 30,
                    });
                  }}
                >
                    <Plus className="mr-2 h-4 w-4" /> Novo Link Público
                  </Button>
                  <Button
                    onClick={() => {
                      const testPlan = plans.data?.find((p: any) => p.name.toLowerCase().includes("teste") || Number(p.price) === 0);
                      setTestLinkCreateSeed(Date.now());
                      setTestLinkModal({ 
                        slug: "dono-livre", 
                        duration_minutes: testPlan ? (testPlan.duration_unit === 'minutes' ? testPlan.duration_value : testPlan.duration_unit === 'hours' ? testPlan.duration_value * 60 : testPlan.duration_value * 1440) : 360, 
                        max_connections: testPlan?.max_connections ?? 1, 
                        is_active: true,
                        description: "Link exclusivo do dono",
                        owner_only: true,
                        allow_repeat_device: true,
                        bonus_days_monthly: 15,
                        bonus_days_quarterly: 30,
                      });
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Link exclusivo do dono
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {testLinksTotal === 0 ? (
                  "Nenhum link de teste criado."
                ) : (
                  <>
                    Página <span className="font-semibold text-foreground">{testLinksSafePage}</span> de{" "}
                    <span className="font-semibold text-foreground">{testLinksTotalPages}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug / Identificador</TableHead>
                    <TableHead>Criado Por</TableHead>
                    <TableHead>Acesso</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Conexões</TableHead>
                    <TableHead>Bônus</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testLinksPage.isLoading ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : testLinksItems.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Nenhum link de teste criado.</TableCell></TableRow>
                ) : (
                  testLinksItems.map((link: any) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-mono text-xs">{link.slug}</TableCell>
                      <TableCell>
                        {link.profile ? (
                          <span className="text-xs font-bold text-primary">@{link.profile.username}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sistema / dono</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {link.owner_only || link.slug === "dono-livre" ? (
                            <Badge variant="secondary" className="text-[9px] uppercase font-bold">Exclusivo do dono</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] uppercase font-bold">Público</Badge>
                          )}
                          {link.owner_only || link.slug === "dono-livre" ? (
                            <Badge variant="outline" className="text-[9px] uppercase font-bold border-online/30 text-online">Sem Bloqueio</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{link.duration_minutes} min</TableCell>
                      <TableCell className="text-xs">{link.max_connections} conn</TableCell>
                      <TableCell>
                        <div className="text-xs leading-5 text-muted-foreground">
                          <div>
                            Mensal: <span className="font-semibold text-foreground">{link.bonus_days_monthly ?? 15} dias</span>
                          </div>
                          <div>
                            Trimestral+: <span className="font-semibold text-foreground">{link.bonus_days_quarterly ?? 30} dias</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full", link.is_active ? "bg-online/10 text-online" : "bg-destructive/10 text-destructive")}>
                          {link.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            disabled={copyingLinkId === link.id}
                            onClick={async () => {
                              const url = `${window.location.origin}/teste/${link.slug}`;
                              setCopyingLinkId(link.id);
                              const ok = await copyToClipboard(url);
                              if (ok) toast.success("Link copiado!");
                              else toast.error("Não foi possível copiar o link.");
                              setCopyingLinkId((current) => (current === link.id ? null : current));
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setTestLinkModal(link)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTestLink(link.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {testLinksTotalPages > 1 && (
            <Card className="border-sidebar-border bg-sidebar/20">
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Página <span className="font-semibold text-foreground">{testLinksSafePage}</span> de{" "}
                  <span className="font-semibold text-foreground">{testLinksTotalPages}</span>
                </div>
                <Pagination className="mx-0 w-auto justify-start md:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setTestLinksCurrentPage((current) => Math.max(1, current - 1));
                        }}
                        className={testLinksSafePage <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {testLinksPaginationPages.map((page) => (
                      <PaginationItem key={page}>
                        <Button
                          variant={page === testLinksSafePage ? "default" : "ghost"}
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setTestLinksCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </PaginationItem>
                    ))}
                    {testLinksTotalPages > testLinksPaginationPages[testLinksPaginationPages.length - 1] && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setTestLinksCurrentPage((current) => Math.min(testLinksTotalPages, current + 1));
                        }}
                        className={testLinksSafePage >= testLinksTotalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4">
          <Card className="border-sidebar-border bg-sidebar/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                Auditoria administrativa
              </CardTitle>
              <CardDescription>
                Ações administrativas recentes, sem credenciais, URLs, tokens ou IDs brutos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Ator</TableHead>
                      <TableHead>Alvo</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Carregando auditoria...
                        </TableCell>
                      </TableRow>
                    ) : auditItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Nenhum evento administrativo registrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditItems.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {entry.created_at ? new Date(entry.created_at).toLocaleString("pt-BR") : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold">{entry.action}</TableCell>
                          <TableCell className="text-xs">{entry.entity_type}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.actor_ref ?? "sistema"}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.target_ref ?? entry.entity_ref ?? "—"}</TableCell>
                          <TableCell className="max-w-[280px] truncate font-mono text-[11px] text-muted-foreground">
                            {formatAuditDetails(entry.details)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {auditTotalPages > 1 ? (
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Página <span className="font-semibold text-foreground">{auditSafePage}</span> de{" "}
                    <span className="font-semibold text-foreground">{auditTotalPages}</span>
                  </p>
                  <Pagination className="mx-0 w-auto justify-start md:justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setAuditPage((current) => Math.max(1, current - 1));
                          }}
                          className={auditSafePage <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {auditPaginationPages.map((page) => (
                        <PaginationItem key={page}>
                          <Button
                            variant={page === auditSafePage ? "default" : "ghost"}
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setAuditPage(page)}
                          >
                            {page}
                          </Button>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setAuditPage((current) => Math.min(auditTotalPages, current + 1));
                          }}
                          className={auditSafePage >= auditTotalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>



      {/* Modal Servidor */}
      <Dialog open={!!serverModal} onOpenChange={(o) => !o && setServerModal(null)}>
        <DialogContent
          key={serverModal?.id ? `server-edit-${serverModal.id}` : `server-create-${serverCreateSeed}`}
          className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleSaveServer} autoComplete="off">
            <input
              aria-hidden="true"
              tabIndex={-1}
              className="sr-only"
              autoComplete="username"
              name="server-modal-username-hint"
            />
            <input
              aria-hidden="true"
              tabIndex={-1}
              className="sr-only"
              type="password"
              autoComplete="current-password"
              name="server-modal-password-hint"
            />
            <DialogHeader>
          <DialogTitle>
            {serverModal?.id ? `Editar ${portalName(Number(serverModal.sort_order) || 0)}` : "Novo portal"}
          </DialogTitle>
              <DialogDescription>
                O nome é definido automaticamente pela ordem. Configure abaixo a origem Xtream Codes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Identificação automática</p>
                <p className="mt-1 text-sm font-semibold">{portalName(Number(serverModal?.sort_order) || 0)}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  A identificação acompanha a ordem definida no arraste.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>DNS do servidor (ex: http://link.site:80)</Label>
                <Input 
                  name="server_dns"
                  autoComplete="off"
                  value={serverModal?.credentials?.[0]?.dns || ""} 
                  onChange={e => {
                    const creds = [...(serverModal.credentials || [])];
                    creds[0] = { ...(creds[0] || {}), dns: e.target.value };
                    setServerModal({...serverModal, credentials: creds});
                  }}
                  placeholder={serverModal?.id ? "Deixe em branco para manter o DNS atual" : "Obrigatório para novo servidor"}
                />
              </div>
              <div className="grid gap-2">
                <Label>Conexões contratadas neste servidor (opcional)</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000000}
                  value={serverModal?.connection_capacity ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setServerModal({
                      ...serverModal,
                      connection_capacity: value ? Number(value) : null,
                    });
                  }}
                  placeholder="Ex.: 1000"
                />
                <p className="text-[10px] text-muted-foreground">
                  Limita conexões simultâneas deste servidor; a quantidade de servidores cadastrados não limita ativos.
                </p>
              </div>
              {serverModal?.can_edit_owner_note ? (
                <div className="grid gap-2">
                  <Label htmlFor="owner_note">Observação privada do dono</Label>
                  <Textarea
                    id="owner_note"
                    name="owner_note"
                    value={serverModal?.owner_note ?? ""}
                    onChange={(event) => setServerModal({ ...serverModal, owner_note: event.target.value })}
                    placeholder="Ex.: referência interna do servidor conectado, contrato, região ou observação operacional."
                    maxLength={2000}
                    rows={4}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Visível e editável somente pelo dono. Usuários e administradores não recebem este conteúdo.
                  </p>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Usuário da API</Label>
                  <Input 
                    name="server_api_username"
                    autoComplete="new-password"
                    data-lpignore="true"
                    value={serverModal?.credentials?.[0]?.username || ""} 
                    onChange={e => {
                    const creds = [...(serverModal.credentials || [])];
                    creds[0] = { ...(creds[0] || {}), username: e.target.value };
                    setServerModal({...serverModal, credentials: creds});
                  }}
                  placeholder={serverModal?.id ? "Deixe em branco para manter o usuário atual" : "Obrigatório para novo servidor"}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Senha da API</Label>
                  <Input 
                    type="password"
                    name="server_api_password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    value={serverModal?.credentials?.[0]?.password || ""} 
                    onChange={e => {
                    const creds = [...(serverModal.credentials || [])];
                    creds[0] = { ...(creds[0] || {}), password: e.target.value };
                    setServerModal({...serverModal, credentials: creds});
                  }}
                  placeholder={serverModal?.id ? "Deixe em branco para manter a senha atual" : "Obrigatório para novo servidor"}
                  />
                </div>
              </div>
                <p className="text-[10px] text-muted-foreground -mt-2">
                Ao editar, os dados atuais do servidor já vêm preenchidos. Se você apagar algum campo e salvar, o sistema mantém o valor atual.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="bulk_action">Ação em massa para usuários</Label>
                <Select 
                  value={serverModal?.bulk_action || "none"} 
                  onValueChange={(val) => setServerModal({...serverModal, bulk_action: val})}
                >
                  <SelectTrigger id="bulk_action">
                    <SelectValue placeholder="Escolha uma ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (apenas salvar servidor)</SelectItem>
                    <SelectItem value="add_to_all">Adicionar este servidor para todos os usuários</SelectItem>
                    <SelectItem value="remove_from_all">Remover este servidor de todos os usuários</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  * A ação será executada ao clicar em Salvar.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setServerModal(null)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Usuario */}
      <Dialog open={!!userModal} onOpenChange={(o) => !o && setUserModal(null)}>
        <DialogContent
          key={userModal?.id ? `user-edit-${userModal.id}` : `user-create-${userCreateSeed}`}
          className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleSaveUser} autoComplete="off">
            <DialogHeader>
              <DialogTitle>{userModal?.id ? "Editar acesso" : "Novo acesso"}</DialogTitle>
              <DialogDescription>
                Gere credenciais para seu cliente acessar o sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Plano de assinatura (opcional)</Label>
                <Select 
                  value={userModal?.plan_id || "none"} 
                  onValueChange={(val) => {
                    const planId = val === "none" ? null : val;
                    const selectedPlan = plans.data?.find((p: any) => p.id === planId);
                    
                    const updates: any = { plan_id: planId };
                    
                    if (selectedPlan) {
                      updates.max_connections = selectedPlan.max_connections;
                      // Calculate expiration if creating or if user wants to reset
                      const expiry = new Date();
                      const factor = selectedPlan.duration_unit === 'minutes' ? 60 * 1000 : selectedPlan.duration_unit === 'hours' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
                      const msToAdd = selectedPlan.duration_value * factor;
                      expiry.setTime(expiry.getTime() + msToAdd);
                      updates.expires_at = expiry.toISOString();
                    }
                    
                    setUserModal({...userModal, ...updates});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Personalizado (Sem plano)</SelectItem>
                    {plans.data?.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nome de exibição (opcional)</Label>
                <Input 
                  autoComplete="off"
                  value={userModal?.display_name || ""} 
                  onChange={e => setUserModal({...userModal, display_name: e.target.value})}
                  placeholder="Ex: José da Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Usuário</Label>
                <Input 
                  name="user_access_username"
                  autoComplete="off"
                  value={userModal?.username || ""} 
                  onChange={e => setUserModal({...userModal, username: e.target.value})}
                  disabled={!!userModal?.id}
                  required 
                  />
                </div>
                <div className="grid gap-2">
                <Label>{userModal?.id ? "Nova senha (opcional)" : "Senha"}</Label>
                <Input 
                  type="password"
                  name="user_access_password"
                  autoComplete="off"
                  value={userModal?.password || ""} 
                  onChange={e => setUserModal({...userModal, password: e.target.value})}
                  required={!userModal?.id} 
                />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Máx. conexões</Label>
                  <Input 
                    type="number"
                    min="1"
                    max="20"
                    autoComplete="off"
                    value={userModal?.max_connections || 1} 
                    onChange={e => setUserModal({...userModal, max_connections: parseInt(e.target.value)})}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Vencimento (UTC)</Label>
                  <Input 
                    type="datetime-local"
                    autoComplete="off"
                    value={userModal?.expires_at ? new Date(userModal.expires_at).toISOString().slice(0, 16) : ""} 
                    onChange={e => setUserModal({...userModal, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Servidores liberados</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                  {servers.data?.map((s: any) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(userModal?.server_ids || []).includes(s.id)}
                        onChange={e => {
                          const ids = [...(userModal.server_ids || [])];
                          if (e.target.checked) ids.push(s.id);
                          else {
                            const idx = ids.indexOf(s.id);
                            if (idx > -1) ids.splice(idx, 1);
                          }
                          setUserModal({...userModal, server_ids: ids});
                        }}
                      />
                      <span className="truncate">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserModal(null)}>Cancelar</Button>
              <Button
                type="submit"
                disabled={loading}
                onClick={(event) => {
                  event.preventDefault();
                  requestSaveUserConfirmation();
                }}
              >
                Salvar acesso
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Test Link */}
      <Dialog open={!!testLinkModal} onOpenChange={(open) => !open && setTestLinkModal(null)}>
        <DialogContent
          key={testLinkModal?.id ? `test-link-edit-${testLinkModal.id}` : `test-link-create-${testLinkCreateSeed}`}
          className="sm:max-w-[425px]"
        >
          <form onSubmit={handleSaveTestLink} autoComplete="off">
            <DialogHeader>
              <DialogTitle>{testLinkModal?.id ? "Editar Link" : "Novo Link de Teste"}</DialogTitle>
              <DialogDescription>
                Configure o link que será enviado para novos clientes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug do Link (Ex: promo-4h)</Label>
                <Input
                  id="slug"
                  name="test_link_slug"
                  autoComplete="off"
                  value={testLinkModal?.slug || ""}
                  onChange={(e) => setTestLinkModal({ ...testLinkModal, slug: e.target.value })}
                  placeholder="identificador-unico"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição para o Usuário</Label>
                <Input
                  id="description"
                  name="test_link_description"
                  autoComplete="off"
                  value={testLinkModal?.description || ""}
                  onChange={(e) => setTestLinkModal({ ...testLinkModal, description: e.target.value })}
                  placeholder="Ex: Teste Premium com Canais 4K"
                />
                <p className="text-[10px] text-muted-foreground">Esta descrição aparecerá na aba Conta do usuário.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!testLinkModal?.owner_only}
                    onChange={(e) => setTestLinkModal({ ...testLinkModal, owner_only: e.target.checked })}
                  />
                  <span>Exclusivo do dono</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!testLinkModal?.allow_repeat_device}
                    onChange={(e) => setTestLinkModal({ ...testLinkModal, allow_repeat_device: e.target.checked })}
                  />
                  <span>Não bloquear o mesmo dispositivo</span>
                </label>
                <p className="text-[10px] text-muted-foreground">
                  Use o modo exclusivo para links privados do dono. O modo sem bloqueio permite criar vários testes no mesmo navegador sem travar o aparelho.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <div className="absolute -top-1 right-0">
                    <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 px-1 border-primary/30 text-primary">Herdado do Plano Teste</Badge>
                  </div>
                  <Label htmlFor="duration" className="opacity-70">Duração do Teste (minutos)</Label>
                  <Input
                    id="duration"
                    name="test_link_duration"
                    autoComplete="off"
                    type="number"
                    value={testLinkModal?.duration_minutes || 240}
                    readOnly
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted-foreground">Configurado automaticamente pelo Plano Teste.</p>
                </div>
                <div className="space-y-2 relative">
                  <div className="absolute -top-1 right-0">
                    <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 px-1 border-primary/30 text-primary">Herdado do Plano Teste</Badge>
                  </div>
                  <Label htmlFor="conn" className="opacity-70">Limite de Conexões</Label>
                  <Input
                    id="conn"
                    name="test_link_connections"
                    autoComplete="off"
                    type="number"
                    value={testLinkModal?.max_connections || 1}
                    readOnly
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted-foreground">Configurado automaticamente pelo Plano Teste.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="active-link"
                  checked={testLinkModal?.is_active ?? true}
                  onChange={(e) => setTestLinkModal({ ...testLinkModal, is_active: e.target.checked })}
                  className="rounded border-border bg-sidebar-accent"
                />
                <Label htmlFor="active-link">Link Ativo</Label>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Bonificação (Configuração Global para este Link)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <Label className="text-xs">Bônus Mensal (Dias)</Label>
                  <Input 
                    name="test_link_bonus_monthly"
                    autoComplete="off"
                    type="number" 
                    value={testLinkModal?.bonus_days_monthly ?? 15}
                    onChange={(e) => setTestLinkModal({ ...testLinkModal, bonus_days_monthly: parseInt(e.target.value) || 0 })}
                    placeholder="15"
                    className="h-8"
                    />
                    <p className="text-[10px] text-muted-foreground">Para planos de até 30 dias.</p>
                  </div>
                  <div className="space-y-2">
                  <Label className="text-xs">Bônus Trimestral+ (Dias)</Label>
                  <Input 
                    name="test_link_bonus_quarterly"
                    autoComplete="off"
                    type="number" 
                    value={testLinkModal?.bonus_days_quarterly ?? 30}
                    onChange={(e) => setTestLinkModal({ ...testLinkModal, bonus_days_quarterly: parseInt(e.target.value) || 0 })}
                    placeholder="30"
                    className="h-8"
                    />
                    <p className="text-[10px] text-muted-foreground">Para planos {" > "} 30 dias.</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  * Estas regras valem para qualquer usuário que usar este link específico.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Plano */}
      <Dialog open={!!planModal} onOpenChange={(o) => !o && setPlanModal(null)}>
        <DialogContent
          key={planModal?.id ? `plan-edit-${planModal.id}` : `plan-create-${planCreateSeed}`}
          className="sm:max-w-[425px]"
        >
          <form onSubmit={handleSavePlan} autoComplete="off">
            <DialogHeader>
              <DialogTitle>{planModal?.id ? "Editar Plano" : "Novo Plano"}</DialogTitle>
              <DialogDescription>
                Configure os detalhes do plano de assinatura.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-name">Nome do Plano</Label>
                <Input 
                  id="plan-name"
                  name="plan_name"
                  autoComplete="off"
                  value={planModal?.name || ""} 
                  onChange={e => setPlanModal({...planModal, name: e.target.value})}
                  placeholder="Ex: Plano Mensal"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan-price">Valor (R$)</Label>
                  <Input 
                  id="plan-price"
                  name="plan_price"
                  autoComplete="off"
                    type="number"
                    step="0.01"
                    value={planModal?.price || 0} 
                    onChange={e => setPlanModal({...planModal, price: parseFloat(e.target.value)})}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plan-duration">Duração</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="plan-duration"
                      name="plan_duration_value"
                      autoComplete="off"
                      type="number"
                      className="flex-1"
                      value={planModal?.duration_value || 30} 
                      onChange={e => setPlanModal({...planModal, duration_value: parseInt(e.target.value)})}
                      required 
                    />
                    <Select 
                      value={planModal?.duration_unit || "days"} 
                      onValueChange={val => setPlanModal({...planModal, duration_unit: val})}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Dias</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                        <SelectItem value="minutes">Minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="plan-conn">Máximo de Conexões</Label>
                  <Input 
                  id="plan-conn"
                  name="plan_max_connections"
                  autoComplete="off"
                  type="number"
                  min="1"
                  value={planModal?.max_connections || 1} 
                  onChange={e => setPlanModal({...planModal, max_connections: parseInt(e.target.value)})}
                  required 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPlanModal(null)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>Salvar Plano</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OwnerPageShell>
  );
}

function ChatWindow({ thread, onClose }: { thread: any, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  const messagesPageSize = 25;
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchMessagesPage = useServerFn(listSupportMessagesPage);
  const mutationSendOwnerMessage = useServerFn(sendSupportOwnerMessage);
  const mutationSendAttachment = useServerFn(sendSupportAttachment);
  const pendingMessageIdRef = useRef<string | null>(null);
  const pendingMessageContentRef = useRef<string | null>(null);

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
    const start = Math.max(1, Math.min(messagesSafePage - 2, messagesTotalPages - (windowSize - 1)));
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
      .channel(`thread:${thread.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages', 
        filter: `thread_id=eq.${thread.id}` 
      }, (payload) => {
        if (messagesPage === 1) {
          setMessages(prev => {
            if (prev.some((message) => message.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread.id, messagesPage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = newMessage.trim();
    if (!content || sending) return;

    if (pendingMessageContentRef.current && pendingMessageContentRef.current !== content) {
      pendingMessageIdRef.current = null;
      pendingMessageContentRef.current = null;
    }

    setSending(true);
    const clientMessageId = pendingMessageIdRef.current ?? crypto.randomUUID();
    pendingMessageIdRef.current = clientMessageId;
    pendingMessageContentRef.current = content;

    try {
      await mutationSendOwnerMessage({
        data: { threadId: thread.id, content, clientMessageId },
      });
      pendingMessageIdRef.current = null;
      pendingMessageContentRef.current = null;
      setNewMessage("");
      setMessagesPage(1);
      await queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
      await queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
    } catch (err: any) {
      toast.error("Erro ao enviar: " + (err?.message || "falha desconhecida"));
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidAttachmentType(file.type)) {
      toast.error("Envie somente imagem ou áudio.");
      e.target.value = "";
      return;
    }
    if (!isAttachmentWithinLimit(file.size)) {
      toast.error("O anexo deve ter no máximo 10 MB.");
      e.target.value = "";
      return;
    }

    setSending(true);
    try {
      const extension = file.name.includes(".")
        ? `.${file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")}`
        : "";
      const filePath = `chat/${thread.id}/${crypto.randomUUID()}${extension}`;
      const fileType = file.type.startsWith("image/") ? "image" : "audio";
      const clientMessageId = crypto.randomUUID();

      const { error: uploadError } = await supabase.storage
        .from("chat-files-v2")
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      await mutationSendAttachment({
        data: { threadId: thread.id, path: filePath, fileType, clientMessageId },
      });
      toast.success("Arquivo enviado!");
      setMessagesPage(1);
      await queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
      await queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
    } catch (err: any) {
      toast.error("Erro no upload: " + (err?.message || "falha desconhecida"));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {(thread.profile?.display_name || thread.profile?.username || "?")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm">{thread.profile?.display_name || thread.profile?.username}</div>
            <div className="text-[10px] text-online font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-online animate-pulse" /> Online
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sidebar-accent/10">
        <div className="flex flex-col gap-3 rounded-2xl border border-sidebar-border/60 bg-sidebar/40 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-xs text-muted-foreground">
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
                {messagesTotalPages > messagesPaginationPages[messagesPaginationPages.length - 1] && (
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
                    className={messagesSafePage >= messagesTotalPages ? "pointer-events-none opacity-50" : ""}
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
          const isMe = msg.sender_id === thread.user_id ? false : true;
          const messageType = inferSupportMessageType(msg, thread.user_id);
          const messageMeta = getSupportMessageTypeMeta(messageType);
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"
              )}>
                {messageType !== "user_message" && (
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]", messageMeta.className)}>
                      {messageMeta.label}
                    </span>
                  </div>
                )}
                {msg.file_url ? (
                  <div className="space-y-2">
                    {msg.file_type === 'image' ? (
                      <img src={msg.file_url} alt="Imagem" className="max-w-full rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(msg.file_url)} />
                    ) : msg.file_type === 'audio' ? (
                      <audio controls src={msg.file_url} className="w-full max-w-[200px]" />
                    ) : (
                      <a href={msg.file_url} target="_blank" className="flex items-center gap-2 underline">
                        <ImageIcon className="h-4 w-4" /> Ver Arquivo
                      </a>
                    )}
                  </div>
                ) : (
                  msg.content
                )}
                <div className="text-[10px] mt-1 opacity-60 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t bg-card">
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload}
            accept="image/*,audio/*"
          />
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input 
            placeholder="Digite sua mensagem..." 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="flex-1 bg-muted/40 border-none focus-visible:ring-1"
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
