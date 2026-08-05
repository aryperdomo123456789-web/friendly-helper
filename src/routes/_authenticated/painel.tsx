import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  listServers, 
  saveServer, 
  deleteServer, 
  listAccessUsers, 
  createAccessUser, 
  updateAccessUser, 
  deleteAccessUser,
  kickDevices,
  testServerConnection
} from "@/lib/owner.functions";
import { getMySession } from "@/lib/player.functions";
import { usePlayerSession } from "@/lib/player-store";
import { getAppConfig, updateAppConfig } from "@/lib/config.functions";
import { AppConfigSchema } from "@/lib/types";


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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
import { 
  Plus, 
  Settings, 
  Users, 
  Server, 
  Trash2, 
  Edit, 
  Wifi, 
  WifiOff, 
  ExternalLink,
  ShieldAlert,
  Calendar,
  Key
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel do Dono | WebPlayer IPTV" },
      { name: "description", content: "Gerenciamento de servidores e acessos de usuarios." },
    ],
  }),
  component: PainelDono,
});

function PainelDono() {
  const { isOwner } = usePlayerSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("acessos");
  const [appConfig, setAppConfig] = useState<any>(null);


  // Server functions
  const fetchServers = useServerFn(listServers);
  const fetchUsers = useServerFn(listAccessUsers);
  const mutationSaveServer = useServerFn(saveServer);
  const mutationDeleteServer = useServerFn(deleteServer);
  const mutationCreateUser = useServerFn(createAccessUser);
  const mutationUpdateUser = useServerFn(updateAccessUser);
  const mutationDeleteUser = useServerFn(deleteAccessUser);
  const mutationKick = useServerFn(kickDevices);
  const mutationTest = useServerFn(testServerConnection);
  const fetchConfig = useServerFn(getAppConfig);
  const mutationSaveConfig = useServerFn(updateAppConfig);

  const configQuery = useQuery({
    queryKey: ["app-config"],
    queryFn: () => fetchConfig(),
    enabled: isOwner,
  });

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


  // State for modals
  const [serverModal, setServerModal] = useState<any>(null);
  const [userModal, setUserModal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* ------------------- Handlers Servidores ------------------- */
  const handleSaveServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mutationSaveServer({ data: serverModal });
      toast.success("Servidor salvo com sucesso!");
      setServerModal(null);
      queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este servidor?")) return;
    try {
      await mutationDeleteServer({ data: { id } });
      toast.success("Servidor removido");
      queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  /* ------------------- Handlers Usuarios ------------------- */
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este acesso? O usuario sera desconectado.")) return;
    try {
      await mutationDeleteUser({ data: { id } });
      toast.success("Acesso removido");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: any) {
      toast.error(err.message);
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

    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel do Dono</h1>
        <p className="text-muted-foreground">Gerencie sua estrutura multi-servidor e seus clientes.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-sidebar-accent/50">
          <TabsTrigger value="acessos" className="gap-2">
            <Users className="h-4 w-4" /> Acessos
          </TabsTrigger>
          <TabsTrigger value="servidores" className="gap-2">
            <Server className="h-4 w-4" /> Servidores
          </TabsTrigger>
          <TabsTrigger value="configuracao" className="gap-2">
            <Settings className="h-4 w-4" /> Configuração Central
          </TabsTrigger>
        </TabsList>


        <TabsContent value="acessos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Usuarios do Sistema</h2>
            <Button onClick={() => setUserModal({ 
              username: "", 
              password: "", 
              display_name: "", 
              max_connections: 1, 
              server_ids: [],
              is_active: true 
            })}>
              <Plus className="mr-2 h-4 w-4" /> Criar Acesso
            </Button>
          </div>

          <Card className="overflow-x-auto">
            <div className="min-w-[800px]">
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
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Carregando...</TableCell></TableRow>
                ) : (users.data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhum usuario cadastrado.</TableCell></TableRow>
                ) : (
                  users.data?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.display_name || user.username}</div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
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
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
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
        </TabsContent>

        <TabsContent value="servidores" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Fontes de IPTV</h2>
            <Button onClick={() => setServerModal({ 
              name: "", 
              credentials: [{ username: "", password: "", dns: "" }],
              is_active: true,
              sort_order: 0
            })}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Servidor
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servers.data?.map((server: any) => (
              <Card key={server.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">{server.name}</CardTitle>
                  <Server className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground truncate mb-4">
                    {server.url}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", server.is_active ? "bg-online/10 text-online" : "bg-destructive/10 text-destructive")}>
                      {server.is_active ? "Ativo" : "Inativo"}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setServerModal(server)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteServer(server.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="configuracao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração Central da Webplayer</CardTitle>
              <CardDescription>Gerencie identidade, temas e textos globais do sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              {configQuery.isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Carregando configurações...</div>
              ) : (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      const data = new FormData(e.currentTarget);
                      const values = Object.fromEntries(data.entries());
                      const newConfig = {
                        ...configQuery.data,
                        name: values['name'] as string,
                        short_name: values['short_name'] as string,
                        domain: values['domain'] as string,
                        base_url: values['base_url'] as string,
                        theme: {
                          ...configQuery.data?.theme,
                          primary: values['primary'] as string,
                          bg: values['bg'] as string,
                        },
                        copy: {
                          ...configQuery.data?.copy,
                          home_title: values['home_title'] as string,
                        }
                      };

                      await mutationSaveConfig({ data: newConfig });
                      toast.success("Configurações salvas!");
                      configQuery.refetch();
                    } catch (err: any) {
                      toast.error("Erro ao salvar: " + err.message);
                    } finally {
                      setLoading(false);
                    }
                  }} 
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
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3">Identidade Visual & Tema</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading}>
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Modal Servidor */}
      <Dialog open={!!serverModal} onOpenChange={(o) => !o && setServerModal(null)}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveServer}>
            <DialogHeader>
              <DialogTitle>{serverModal?.id ? "Editar Servidor" : "Novo Servidor"}</DialogTitle>
              <DialogDescription>
                Configure os dados da API Xtream Codes do servidor.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome para exibicao</Label>
                <Input 
                  id="name" 
                  value={serverModal?.name || ""} 
                  onChange={e => setServerModal({...serverModal, name: e.target.value})}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label>DNS do Servidor (ex: http://link.site:80)</Label>
                <Input 
                  value={serverModal?.credentials?.[0]?.dns || ""} 
                  onChange={e => {
                    const creds = [...(serverModal.credentials || [])];
                    creds[0] = { ...(creds[0] || {}), dns: e.target.value };
                    setServerModal({...serverModal, credentials: creds});
                  }}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Usuario API</Label>
                  <Input 
                    value={serverModal?.credentials?.[0]?.username || ""} 
                    onChange={e => {
                      const creds = [...(serverModal.credentials || [])];
                      creds[0] = { ...(creds[0] || {}), username: e.target.value };
                      setServerModal({...serverModal, credentials: creds});
                    }}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Senha API</Label>
                  <Input 
                    type="password"
                    value={serverModal?.credentials?.[0]?.password || ""} 
                    onChange={e => {
                      const creds = [...(serverModal.credentials || [])];
                      creds[0] = { ...(creds[0] || {}), password: e.target.value };
                      setServerModal({...serverModal, credentials: creds});
                    }}
                    required 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setServerModal(null)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Usuario */}
      <Dialog open={!!userModal} onOpenChange={(o) => !o && setUserModal(null)}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveUser}>
            <DialogHeader>
              <DialogTitle>{userModal?.id ? "Editar Acesso" : "Novo Acesso"}</DialogTitle>
              <DialogDescription>
                Gere credenciais para seu cliente acessar o WebPlayer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome de Exibicao (Opcional)</Label>
                <Input 
                  value={userModal?.display_name || ""} 
                  onChange={e => setUserModal({...userModal, display_name: e.target.value})}
                  placeholder="Ex: Jose da Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Usuario</Label>
                  <Input 
                    value={userModal?.username || ""} 
                    onChange={e => setUserModal({...userModal, username: e.target.value})}
                    disabled={!!userModal?.id}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{userModal?.id ? "Nova Senha (opcional)" : "Senha"}</Label>
                  <Input 
                    type="password"
                    value={userModal?.password || ""} 
                    onChange={e => setUserModal({...userModal, password: e.target.value})}
                    required={!userModal?.id} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Max Conexoes</Label>
                  <Input 
                    type="number"
                    min="1"
                    max="20"
                    value={userModal?.max_connections || 1} 
                    onChange={e => setUserModal({...userModal, max_connections: parseInt(e.target.value)})}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Vencimento (UTC)</Label>
                  <Input 
                    type="datetime-local"
                    value={userModal?.expires_at ? new Date(userModal.expires_at).toISOString().slice(0, 16) : ""} 
                    onChange={e => setUserModal({...userModal, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Servidores Liberados</Label>
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
              <Button type="submit" disabled={loading}>Salvar Acesso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
