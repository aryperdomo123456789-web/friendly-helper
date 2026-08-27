import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPlans } from "@/lib/plans.functions";
import {
  listServers,
  listAccessUsersPage,
  createAccessUser,
  updateAccessUser,
  deleteAccessUser,
  kickDevices,
} from "@/lib/owner.functions";
import { usePlayerSession } from "@/lib/player-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Wifi, WifiOff, Calendar, LogOut, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OwnerPageShell } from "@/components/owner-shell/owner-page-shell";



export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários" },
      {
        name: "description",
        content:
          "Crie e gerencie usuários com acesso a canais, filmes, séries e troca de servidor.",
      },
      { property: "og:title", content: "Usuários" },
      {
        property: "og:description",
        content: "Gestão de acessos com limite de conexões por dispositivo.",
      },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const { isOwner } = usePlayerSession();
  const queryClient = useQueryClient();
  const [userModal, setUserModal] = useState<any>(null);
  const [userCreateSeed, setUserCreateSeed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [destructiveLoading, setDestructiveLoading] = useState(false);
  const [saveConfirm, setSaveConfirm] = useState<null | {
    title: string;
    description: string;
  }>(null);
  const [destructiveConfirm, setDestructiveConfirm] = useState<null | {
    kind: "delete" | "kick";
    title: string;
    description: string;
    actionLabel: string;
    targetId: string;
  }>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked" | "expired" | "online">("all");
  const [serverFilter, setServerFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [referralFilter, setReferralFilter] = useState<"all" | "direct" | "referred">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "expiry">("newest");
  const [pageSize, setPageSize] = useState<10 | 25 | 50 | 250 | 500 | 1000>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchServers = useServerFn(listServers);
  const fetchUsersPage = useServerFn(listAccessUsersPage);
  const fetchPlans = useServerFn(getPlans);
  const mutationCreateUser = useServerFn(createAccessUser);
  const mutationUpdateUser = useServerFn(updateAccessUser);
  const mutationDeleteUser = useServerFn(deleteAccessUser);
  const mutationKick = useServerFn(kickDevices);

  const servers = useQuery({
    queryKey: ["admin-servers"],
    queryFn: () => fetchServers(),
    enabled: isOwner,
  });
  const usersPage = useQuery({
    queryKey: [
      "admin-users-page",
      debouncedSearch,
      statusFilter,
      serverFilter,
      planFilter,
      referralFilter,
      sortOrder,
      currentPage,
      pageSize,
    ],
    queryFn: () =>
      fetchUsersPage({
        data: {
          search: debouncedSearch,
          status: statusFilter,
          server_id: serverFilter === "all" ? null : serverFilter,
          plan_id: planFilter === "all" || planFilter === "" ? null : planFilter,
          referral: referralFilter,
          sort_order: sortOrder,
          page: currentPage,
          page_size: pageSize,
        },
      }),
    enabled: isOwner,
    placeholderData: (previous) => previous,
  });
  const plans = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => fetchPlans(),
    enabled: isOwner,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, serverFilter, planFilter, referralFilter, sortOrder, pageSize]);

  const handleSaveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userModal?.server_ids?.length) {
      toast.error("Selecione pelo menos um servidor");
      return;
    }
    const pwd = (userModal.password || "").trim();
    if (!userModal.id && pwd.length < 6) {
      toast.error("A senha precisa ter no minimo 6 caracteres");
      return;
    }
    if (userModal.id && pwd.length > 0 && pwd.length < 6) {
      toast.error("A nova senha precisa ter no minimo 6 caracteres");
      return;
    }

    setSaveConfirm({
      title: userModal.id ? "Confirmar atualização do usuário" : "Confirmar criação do usuário",
      description: userModal.id
        ? "Você tem certeza que deseja salvar as alterações deste acesso?"
        : "Você tem certeza que deseja criar este novo acesso?",
    });
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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar usuário");
    } finally {
      setLoading(false);
    }
  };

  const confirmSaveAction = async () => {
    if (!saveConfirm) return;
    await executeSaveUser();
  };

  const handleDeleteUser = async (id: string) => {
    setDestructiveConfirm({
      kind: "delete",
      title: "Confirmar remoção do acesso",
      description: "Esta ação remove o acesso e desconecta o usuário. Deseja continuar?",
      actionLabel: "Sim, remover",
      targetId: id,
    });
  };

  const executeDeleteUser = async (id: string) => {
    setDestructiveLoading(true);
    try {
      await mutationDeleteUser({ data: { id } });
      toast.success("Acesso removido com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDestructiveConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover usuário");
    } finally {
      setDestructiveLoading(false);
    }
  };

  const handleKick = async (id: string) => {
    setDestructiveConfirm({
      kind: "kick",
      title: "Confirmar desconexão",
      description: "Esta ação desconecta todos os dispositivos deste usuário. Deseja continuar?",
      actionLabel: "Sim, desconectar",
      targetId: id,
    });
  };

  const executeKick = async (id: string) => {
    setDestructiveLoading(true);
    try {
      await mutationKick({ data: { id } });
      toast.success("Dispositivos desconectados com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDestructiveConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao desconectar");
    } finally {
      setDestructiveLoading(false);
    }
  };

  const confirmDestructiveAction = async () => {
    if (!destructiveConfirm) return;
    if (destructiveConfirm.kind === "delete") {
      await executeDeleteUser(destructiveConfirm.targetId);
      return;
    }
    await executeKick(destructiveConfirm.targetId);
  };

  const toggleServer = (serverId: string) => {
    const current: string[] = userModal.server_ids ?? [];
    setUserModal({
      ...userModal,
      server_ids: current.includes(serverId)
        ? current.filter((id) => id !== serverId)
        : [...current, serverId],
    });
  };

  const totalUsers = usersPage.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = totalUsers === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, totalUsers);
  const visibleUsers = usersPage.data?.items ?? [];
  const statusCounts = usersPage.data?.status_counts ?? {
    all: 0,
    active: 0,
    blocked: 0,
    expired: 0,
    online: 0,
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginationPages = useMemo(() => {
    const windowSize = 5;
    if (totalPages <= windowSize) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, Math.min(safePage - 2, totalPages - (windowSize - 1)));
    const end = Math.min(totalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safePage, totalPages]);


  if (!isOwner) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <p className="font-semibold">Área restrita ao dono do sistema.</p>
      </div>
    );
  }

  return (
    <OwnerPageShell
      className="mx-auto max-w-7xl pb-20"
      title="Usuários do sistema"
      description="Crie, edite e proteja acessos com uma superfície visual própria para operação, separada da experiência do cliente."
      icon={Users}
      rightSlot={
        <div className="w-full max-w-[140px] rounded-xl border border-sidebar-border/70 bg-background/60 px-2.5 py-2 text-[10px] leading-snug shadow-sm">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-muted-foreground">Operação</p>
          <p className="mt-0.5 truncate font-semibold text-foreground">Acessos e limites</p>
        </div>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Cada usuário criado acessa canais, filmes, séries e troca de servidor.
          </p>
        </div>
        <Button
          onClick={() => {
            const testPlan = plans.data?.find((p: any) => p.name.toLowerCase().includes("teste"));
            setUserCreateSeed(Date.now());
            setUserModal({
              username: "",
              password: "",
              display_name: "",
              max_connections: testPlan?.max_connections ?? 1,
              server_ids: (servers.data ?? []).map((server: any) => server.id),
              is_active: true,
              plan_id: testPlan?.id || null,
              expires_at: testPlan 
                ? new Date(Date.now() + testPlan.duration_value * (testPlan.duration_unit === 'minutes' ? 60 * 1000 : testPlan.duration_unit === 'hours' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString()
                : null
            });
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Criar usuário
        </Button>
      </div>

      <Card className="border-primary/20 bg-card/50 p-4 backdrop-blur-sm">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <TabsList className="grid h-auto w-full grid-cols-5 gap-1 rounded-xl bg-muted/40 p-1">
                <TabsTrigger value="all" className="h-10 rounded-lg text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    Todos
                    <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {statusCounts.all}
                    </span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="active" className="h-10 rounded-lg text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    Ativos
                    <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {statusCounts.active}
                    </span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="online" className="h-10 rounded-lg text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    Online
                    <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {statusCounts.online}
                    </span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="blocked" className="h-10 rounded-lg text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    Bloqueados
                    <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {statusCounts.blocked}
                    </span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="expired" className="h-10 rounded-lg text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    Expirados
                    <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {statusCounts.expired}
                    </span>
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1.5 xl:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Buscar</Label>
              <Input
                placeholder="Username ou nome..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Servidor</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={serverFilter}
                onChange={(event) => setServerFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                {servers.data?.map((server: any) => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Plano</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                <option value="">Sem Plano</option>
                {plans.data?.map((plan: any) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Indicação</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={referralFilter}
                onChange={(event) => setReferralFilter(event.target.value as any)}
              >
                <option value="all">Todas</option>
                <option value="direct">Direto</option>
                <option value="referred">Indicado</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Ordenar</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as any)}
              >
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="expiry">Vencimento</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border/40 pt-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-xs text-muted-foreground">
                Mostrando <span className="font-bold text-primary">{pageStart}</span> a{" "}
                <span className="font-bold text-primary">{pageEnd}</span> de{" "}
                <span className="font-bold">{totalUsers}</span> usuários
              </div>

              <div className="w-[150px]">
                <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Linhas por página
                </Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => setPageSize(Number(value) as typeof pageSize)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 250, 500, 1000].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setServerFilter("all");
                setPlanFilter("all");
                setReferralFilter("all");
                setSortOrder("newest");
                setPageSize(10);
                setCurrentPage(1);
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Indicação</TableHead>
              <TableHead>Servidores</TableHead>
              <TableHead className="text-center">Conexões</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersPage.isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-xs text-destructive">
                  {usersPage.error instanceof Error ? usersPage.error.message : "Falha ao carregar usuários."}
                </TableCell>
              </TableRow>
            ) : usersPage.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                  Carregando usuários...
                </TableCell>
              </TableRow>
            ) : totalUsers === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                  Nenhum usuário encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              visibleUsers.map((user: any) => (
                (() => {
                  const isProtectedOwner = user.username === "magodono";
                  return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.display_name || user.username}</div>
                    <div className="text-xs text-muted-foreground">@{user.username}</div>
                  </TableCell>
                  <TableCell>
                    {user.referred_by ? (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        @{user.referred_by.username}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Direto</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{user.server_ids.length} sv(s)</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        user.online > 0
                          ? "bg-online/10 text-online"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {user.online} / {user.max_connections}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {user.expires_at ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.expires_at).toLocaleDateString("pt-BR")}
                      </span>
                    ) : (
                      "Sem limite"
                    )}
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
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Desconectar dispositivos"
                        onClick={() => handleKick(user.id)}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setUserModal(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!isProtectedOwner ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground/40 cursor-not-allowed"
                          title="O dono não pode ser apagado"
                          disabled
                        >
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

      {totalUsers > 0 && totalPages > 1 && (
        <Card className="border-primary/10 bg-card/40 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Página <span className="font-semibold text-foreground">{safePage}</span> de{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
              >
                Primeira
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
              >
                Anterior
              </Button>

              {paginationPages.map((page) => (
                <Button
                  key={page}
                  type="button"
                  size="sm"
                  variant={page === safePage ? "default" : "outline"}
                  className="min-w-10"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safePage === totalPages}
              >
                Próxima
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
              >
                Última
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={!!userModal} onOpenChange={(open) => !open && setUserModal(null)}>
        <DialogContent
          key={userModal?.id ? `user-edit-${userModal.id}` : `user-create-${userCreateSeed}`}
          className="sm:max-w-[520px] w-[95vw] max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleSaveUser} autoComplete="off">
            <DialogHeader>
              <DialogTitle>{userModal?.id ? "Editar usuário" : "Novo usuário"}</DialogTitle>
              <DialogDescription>
                Credenciais de acesso ao sistema com limite de conexões por dispositivo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome de exibição (opcional)</Label>
                <Input
                  name="user_display_name"
                  autoComplete="off"
                  value={userModal?.display_name || ""}
                  onChange={(e) => setUserModal({ ...userModal, display_name: e.target.value })}
                  placeholder="Ex: José da Silva"
                />
              </div>
              <div className="grid gap-2">
                <Label>Plano de assinatura (opcional)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={userModal?.plan_id || ""} 
                  onChange={(e) => {
                    const planId = e.target.value || null;
                    const selectedPlan = plans.data?.find((p: any) => p.id === planId);
                    
                    const updates: any = { plan_id: planId };
                    
                    if (selectedPlan) {
                      updates.max_connections = selectedPlan.max_connections;
                      const expiry = new Date();
                      const factor = selectedPlan.duration_unit === 'minutes' ? 60 * 1000 : selectedPlan.duration_unit === 'hours' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
                      const msToAdd = selectedPlan.duration_value * factor;
                      expiry.setTime(expiry.getTime() + msToAdd);
                      updates.expires_at = expiry.toISOString();
                    }
                    
                    setUserModal({...userModal, ...updates});
                  }}
                >
                  <option value="">Personalizado (Sem plano)</option>
                  {(plans.data ?? []).map((plan: any) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - R$ {Number(plan.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                <Label>Usuário</Label>
                <Input
                  name="user_username"
                  autoComplete="off"
                  value={userModal?.username || ""}
                  onChange={(e) => setUserModal({ ...userModal, username: e.target.value })}
                  disabled={!!userModal?.id}
                  required
                />
                </div>
                <div className="grid gap-2">
                <Label>{userModal?.id ? "Nova senha (opcional)" : "Senha"}</Label>
                <Input
                  type="password"
                  name="user_password"
                  autoComplete="new-password"
                  value={userModal?.password || ""}
                  minLength={6}
                  placeholder="Mínimo de 6 caracteres"
                  onChange={(e) => setUserModal({ ...userModal, password: e.target.value })}
                  required={!userModal?.id}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Máx. conexões</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    name="user_max_connections"
                    autoComplete="off"
                    value={userModal?.max_connections ?? 1}
                    onChange={(e) =>
                      setUserModal({
                        ...userModal,
                        max_connections: parseInt(e.target.value || "1", 10),
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Vencimento (opcional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !userModal?.expires_at && "text-muted-foreground",
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {userModal?.expires_at
                          ? format(new Date(userModal.expires_at), "dd/MM/yyyy")
                          : "Escolher data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        locale={ptBR}
                        captionLayout="dropdown"
                        startMonth={new Date(1970, 0)}
                        endMonth={new Date(2100, 11)}
                        defaultMonth={
                          userModal?.expires_at ? new Date(userModal.expires_at) : new Date()
                        }
                        selected={
                          userModal?.expires_at ? new Date(userModal.expires_at) : undefined
                        }
                        onSelect={(date) =>
                          setUserModal({
                            ...userModal,
                            expires_at: date
                              ? new Date(
                                  date.getFullYear(),
                                  date.getMonth(),
                                  date.getDate(),
                                  23,
                                  59,
                                  59,
                                ).toISOString()
                              : null,
                          })
                        }
                        className="pointer-events-auto p-3"
                      />
                      {userModal?.expires_at ? (
                        <div className="border-t p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => setUserModal({ ...userModal, expires_at: null })}
                          >
                            Sem validade
                          </Button>
                        </div>
                      ) : null}
                    </PopoverContent>
                  </Popover>
                </div>

              </div>
              <div className="grid gap-2">
                <Label>Servidores liberados</Label>
                <div className="grid max-h-[150px] grid-cols-2 gap-2 overflow-y-auto rounded-md border p-2">
                  {servers.data?.map((server: any) => (
                    <label
                      key={server.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={(userModal?.server_ids ?? []).includes(server.id)}
                        onChange={() => toggleServer(server.id)}
                      />
                      {server.name}
                    </label>
                  ))}
                </div>
              </div>
              {userModal?.id ? (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!userModal?.is_active}
                    onChange={(e) => setUserModal({ ...userModal, is_active: e.target.checked })}
                  />
                  Acesso ativo
                </label>
              ) : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserModal(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!saveConfirm} onOpenChange={(open) => !open && setSaveConfirm(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{saveConfirm?.title ?? "Confirmar salvamento"}</DialogTitle>
            <DialogDescription>
              {saveConfirm?.description ?? "Você tem certeza que deseja salvar estas alterações?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveConfirm(null)} disabled={loading}>
              Não, voltar
            </Button>
            <Button type="button" onClick={() => void confirmSaveAction()} disabled={loading}>
              {loading ? "Salvando..." : "Sim, salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!destructiveConfirm} onOpenChange={(open) => !open && setDestructiveConfirm(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{destructiveConfirm?.title ?? "Confirmar ação"}</DialogTitle>
            <DialogDescription>
              {destructiveConfirm?.description ?? "Você tem certeza que deseja continuar?"}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-muted-foreground">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-destructive">Ação irreversível</p>
            <p className="mt-2">
              Esta operação altera dados e não deve ser executada sem intenção explícita.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDestructiveConfirm(null)}
              disabled={destructiveLoading}
            >
              Não, voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmDestructiveAction()}
              disabled={destructiveLoading}
            >
              {destructiveLoading ? "Executando..." : destructiveConfirm?.actionLabel ?? "Sim, continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerPageShell>
  );
}
