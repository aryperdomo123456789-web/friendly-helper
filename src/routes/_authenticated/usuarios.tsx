import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPlans } from "@/lib/plans.functions";
import {
  listServers,
  listAccessUsers,
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
import { Plus, Trash2, Edit, Wifi, WifiOff, Calendar, LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";



export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios | WebPlayer IPTV" },
      {
        name: "description",
        content:
          "Crie e gerencie usuarios com acesso a canais, filmes, series e troca de servidor no WebPlayer IPTV.",
      },
      { property: "og:title", content: "Usuarios | WebPlayer IPTV" },
      {
        property: "og:description",
        content: "Gestao de acessos com limite de conexoes por dispositivo.",
      },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const { isOwner } = usePlayerSession();
  const queryClient = useQueryClient();

  const fetchServers = useServerFn(listServers);
  const fetchUsers = useServerFn(listAccessUsers);
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
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
    enabled: isOwner,
  });
  const plans = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => fetchPlans(),
    enabled: isOwner,
  });

  const [userModal, setUserModal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked" | "expired" | "online">("all");
  const [serverFilter, setServerFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [referralFilter, setReferralFilter] = useState<"all" | "direct" | "referred">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "expiry">("newest");


  if (!isOwner) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <p className="font-semibold">Area restrita ao dono do sistema.</p>
      </div>
    );
  }

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

    setLoading(true);
    try {
      if (userModal.id) {
        await mutationUpdateUser({ data: userModal });
        toast.success("Acesso atualizado com sucesso!");
      } else {
        await mutationCreateUser({ data: userModal });
        toast.success("Novo acesso criado com sucesso!");
      }
      setUserModal(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este acesso? O usuario sera desconectado.")) return;
    try {
      await mutationDeleteUser({ data: { id } });
      toast.success("Acesso removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover usuário");
    }
  };

  const handleKick = async (id: string) => {
    if (!confirm("Tem certeza que deseja desconectar todos os dispositivos deste usuário?")) return;
    try {
      await mutationKick({ data: { id } });
      toast.success("Dispositivos desconectados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao desconectar");
    }
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

  const filteredUsers = (users.data ?? []).filter((user: any) => {
    // Busca por nome ou username
    const matchesSearch = 
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      (user.display_name && user.display_name.toLowerCase().includes(search.toLowerCase()));
    
    // Filtro de status
    const now = new Date();
    const isExpired = user.expires_at && new Date(user.expires_at) < now;
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active && !isExpired) ||
      (statusFilter === "blocked" && !user.is_active) ||
      (statusFilter === "expired" && isExpired) ||
      (statusFilter === "online" && user.online > 0);

    // Filtro de servidor
    const matchesServer = serverFilter === "all" || user.server_ids.includes(serverFilter);

    // Filtro de plano
    const matchesPlan = planFilter === "all" || user.plan_id === planFilter;

    // Filtro de indicação
    const matchesReferral = 
      referralFilter === "all" ||
      (referralFilter === "direct" && !user.referred_by_id) ||
      (referralFilter === "referred" && !!user.referred_by_id);

    return matchesSearch && matchesStatus && matchesServer && matchesPlan && matchesReferral;
  }).sort((a: any, b: any) => {
    if (sortOrder === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortOrder === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortOrder === "expiry") {
      if (!a.expires_at) return 1;
      if (!b.expires_at) return -1;
      return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gerencie acessos e monitore conexões em tempo real.
          </p>
        </div>
        <div className="flex gap-2">
           <Button
            variant="outline"
            onClick={() => {
              const csv = [
                ["Username", "Exibicao", "Plano", "Expira em", "Conexoes", "Status"].join(","),
                ...filteredUsers.map((u: any) => [
                  u.username,
                  u.display_name || "",
                  u.plan?.name || "Personalizado",
                  u.expires_at ? format(new Date(u.expires_at), "dd/MM/yyyy") : "Sem limite",
                  `${u.online}/${u.max_connections}`,
                  u.is_active ? "Ativo" : "Bloqueado"
                ].join(","))
              ].join("\n");
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.setAttribute("download", `usuarios-webplayer-${format(new Date(), 'yyyy-MM-dd')}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            Exportar CSV
          </Button>
          <Button
            onClick={() => {
              const testPlan = plans.data?.find((p: any) => p.name.toLowerCase().includes("teste"));
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
            <Plus className="mr-2 h-4 w-4" /> Criar Usuario
          </Button>
        </div>
      </div>

      {/* Painel de Filtros Profissional */}
      <Card className="p-4 border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="space-y-1.5 xl:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Buscar</Label>
            <Input 
              placeholder="Username ou nome..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
            <select 
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="online">Online</option>
              <option value="blocked">Bloqueados</option>
              <option value="expired">Expirados</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Servidor</Label>
            <select 
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={serverFilter}
              onChange={(e) => setServerFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              {servers.data?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Plano</Label>
            <select 
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="">Sem Plano</option>
              {plans.data?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Ordenar</Label>
            <select 
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="expiry">Vencimento</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
          <div className="text-xs text-muted-foreground">
            Mostrando <span className="font-bold text-primary">{filteredUsers.length}</span> de <span className="font-bold">{users.data?.length || 0}</span> usuários
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setServerFilter("all");
              setPlanFilter("all");
              setReferralFilter("all");
              setSortOrder("newest");
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      <Card className="overflow-x-auto border-primary/10">
        <div className="min-w-[800px]">
          <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-primary/10">
              <TableHead className="w-[200px]">Usuario</TableHead>
              <TableHead>Indicação</TableHead>
              <TableHead>Servidores</TableHead>
              <TableHead className="text-center">Conexoes</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                  Carregando usuários...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                  Nenhum usuario encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: any) => (

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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
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

      <Dialog open={!!userModal} onOpenChange={(open) => !open && setUserModal(null)}>
        <DialogContent className="sm:max-w-[520px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveUser}>
            <DialogHeader>
              <DialogTitle>{userModal?.id ? "Editar Usuario" : "Novo Usuario"}</DialogTitle>
              <DialogDescription>
                Credenciais de acesso ao WebPlayer com limite de conexoes por dispositivo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome de exibicao (opcional)</Label>
                <Input
                  value={userModal?.display_name || ""}
                  onChange={(e) => setUserModal({ ...userModal, display_name: e.target.value })}
                  placeholder="Ex: Jose da Silva"
                />
              </div>
              <div className="grid gap-2">
                <Label>Plano de Assinatura (Opcional)</Label>
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
                  <Label>Usuario</Label>
                  <Input
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
                    value={userModal?.password || ""}
                    minLength={6}
                    placeholder="Minimo 6 caracteres"
                    onChange={(e) => setUserModal({ ...userModal, password: e.target.value })}
                    required={!userModal?.id}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Max conexoes</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
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
    </div>
  );
}
