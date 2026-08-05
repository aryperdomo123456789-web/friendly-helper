import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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

  const [userModal, setUserModal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      if (userModal.id) {
        await mutationUpdateUser({ data: userModal });
        toast.success("Acesso atualizado");
      } else {
        await mutationCreateUser({ data: userModal });
        toast.success("Novo acesso criado!");
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
    if (!confirm("Remover este acesso? O usuario sera desconectado.")) return;
    try {
      await mutationDeleteUser({ data: { id } });
      toast.success("Acesso removido");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover");
    }
  };

  const handleKick = async (id: string) => {
    try {
      await mutationKick({ data: { id } });
      toast.success("Dispositivos desconectados");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Cada usuario criado acessa Canais, Filmes, Series e troca de servidor.
          </p>
        </div>
        <Button
          onClick={() =>
            setUserModal({
              username: "",
              password: "",
              display_name: "",
              max_connections: 1,
              server_ids: (servers.data ?? []).map((server: any) => server.id),
              is_active: true,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Criar Usuario
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
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
                <TableCell colSpan={6} className="h-24 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : (users.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum usuario cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              users.data?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.display_name || user.username}</div>
                    <div className="text-xs text-muted-foreground">@{user.username}</div>
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
      </Card>

      <Dialog open={!!userModal} onOpenChange={(open) => !open && setUserModal(null)}>
        <DialogContent className="sm:max-w-[520px]">
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
