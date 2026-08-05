import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
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
import {
  listTestLinks,
  saveTestLink,
  deleteTestLink
} from "@/lib/test-links.functions";
import { getMySession } from "@/lib/player.functions";
import { usePlayerSession } from "@/lib/player-store";
import { getAppConfig, updateAppConfig } from "@/lib/config.functions";
import { getPlans, savePlan, deletePlan } from "@/lib/plans.functions";
import { listSupportThreads, markThreadRead } from "@/lib/chat.functions";
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
  Key,
  Link as LinkIcon,
  Copy,
  MessageSquare,
  Send,
  Image as ImageIcon,
  Mic,
  X,
  Share2
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
  const fetchTestLinks = useServerFn(listTestLinks);
  const mutationSaveTestLink = useServerFn(saveTestLink);
  const mutationDeleteTestLink = useServerFn(deleteTestLink);
  const fetchPlans = useServerFn(getPlans);
  const mutationSavePlan = useServerFn(savePlan);
  const mutationDeletePlan = useServerFn(deletePlan);
  const fetchThreads = useServerFn(listSupportThreads);
  const mutationMarkRead = useServerFn(markThreadRead);

  const threads = useQuery({
    queryKey: ["support-threads"],
    queryFn: () => fetchThreads(),
    enabled: isOwner,
    refetchInterval: 10000,
  });

  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const plans = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => fetchPlans(),
    enabled: isOwner,
  });

  const testLinks = useQuery({
    queryKey: ["admin-test-links"],
    queryFn: () => fetchTestLinks(),
    enabled: isOwner,
  });

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
  const [testLinkModal, setTestLinkModal] = useState<any>(null);
  const [planModal, setPlanModal] = useState<any>(null);

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
      toast.success("Servidor removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir servidor");
    }
  };

  /* ------------------- Handlers Usuarios ------------------- */
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mutationSaveTestLink({ data: testLinkModal });
      toast.success("Link de teste salvo com sucesso!");
      setTestLinkModal(null);
      queryClient.invalidateQueries({ queryKey: ["admin-test-links"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar link");
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
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir link");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este acesso? O usuario sera desconectado.")) return;
    try {
      await mutationDeleteUser({ data: { id } });
      toast.success("Acesso removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir usuário");
    }
  };
  
  /* ------------------- Handlers Planos ------------------- */
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mutationSavePlan({ data: planModal });
      toast.success("Plano salvo com sucesso!");
      setPlanModal(null);
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      // Re-invalidate users because plans affect them
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar plano");
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
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir plano");
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
            <Settings className="h-4 w-4" /> Central
          </TabsTrigger>
          <TabsTrigger value="suporte" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Suporte 
            {threads.data?.some((t: any) => t.unread_count_owner > 0) && (
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="planos" className="gap-2">
            <Key className="h-4 w-4" /> Planos
          </TabsTrigger>
          <TabsTrigger value="referencia" className="gap-2">
            <Share2 className="h-4 w-4" /> Indicação
          </TabsTrigger>
        </TabsList>


        <TabsContent value="acessos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Usuarios do Sistema</h2>
            <Button onClick={() => {
              const testPlan = plans.data?.find((p: any) => p.name.toLowerCase().includes("teste") || Number(p.price) === 0);
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
              <Plus className="mr-2 h-4 w-4" /> Criar Acesso
            </Button>
          </div>

          <Card className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                   <TableHead>Referência</TableHead>
                  <TableHead>Servidores</TableHead>
                  <TableHead className="text-center">Conexoes</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.isLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground uppercase tracking-widest">Carregando...</TableCell></TableRow>
                ) : (users.data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground uppercase tracking-widest">Nenhum usuario cadastrado.</TableCell></TableRow>
                ) : (
                  users.data?.map((user: any) => (
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

        <TabsContent value="testes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Links de Indicação (Teste Grátis)</h2>
            <Button onClick={() => setTestLinkModal({ 
              slug: "", 
              duration_minutes: 240,
              max_connections: 1,
              is_active: true
            })}>
              <Plus className="mr-2 h-4 w-4" /> Novo Link
            </Button>
          </div>

          <Card className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificador (Slug)</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Conexões</TableHead>
                    <TableHead>URL Pública</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testLinks.isLoading ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Carregando...</TableCell></TableRow>
                  ) : (testLinks.data ?? []).length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhum link de teste criado.</TableCell></TableRow>
                  ) : (
                    testLinks.data?.map((link: any) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">{link.slug}</TableCell>
                        <TableCell>
                          {Math.floor(link.duration_minutes / 60)}h {link.duration_minutes % 60}m
                        </TableCell>
                        <TableCell>{link.max_connections}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                              /teste/{link.slug}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => {
                                const url = `${window.location.origin}/teste/${link.slug}`;
                                navigator.clipboard.writeText(url);
                                toast.success("URL copiada com sucesso!");
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
                        logo_url: values['logo_url'] as string,
                        logo_small_url: values['logo_small_url'] as string,
                        favicon_url: values['favicon_url'] as string,
                        tmdb_api_key: values['tmdb_api_key'] as string || undefined,
                        epg_xmltv_url: values['epg_xmltv_url'] as string || undefined,
                        theme_mode: values['theme_mode'] as "azul" | "dark" | "light",
                        mp_access_token: values['mp_access_token'] as string,
                        mp_public_key: values['mp_public_key'] as string,
                        mp_enabled: values['mp_enabled'] === 'on',
                        theme: {
                          ...configQuery.data?.theme,
                          primary: values['primary'] as string,
                          bg: values['bg'] as string,
                        },
                        support_attendant_name: values['support_attendant_name'] as string,
                        support_auto_reply: values['support_auto_reply'] as string,
                        copy: {
                          ...configQuery.data?.copy,
                          home_title: values['home_title'] as string,
                        }
                      };

                      await mutationSaveConfig({ data: newConfig });
                      toast.success("Configurações salvas com sucesso!");
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
                      </div>
                      <div className="space-y-2">
                        <Label>Logo Miniatura (URL)</Label>
                        <Input name="logo_small_url" placeholder="https://exemplo.com/logo-small.png" defaultValue={configQuery.data?.logo_small_url} />
                      </div>
                      <div className="space-y-2">
                        <Label>Favicon / Ícone (URL)</Label>
                        <Input name="favicon_url" placeholder="https://exemplo.com/favicon.ico" defaultValue={configQuery.data?.favicon_url} />
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

        <TabsContent value="suporte" className="h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
            <Card className="md:col-span-4 flex flex-col overflow-hidden bg-sidebar/30 border-sidebar-border">
              <CardHeader className="py-4 border-b border-sidebar-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Conversas
                </CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {threads.isLoading ? (
                  <div className="p-4 text-center">Carregando...</div>
                ) : (threads.data ?? []).length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm italic">Nenhuma conversa ativa.</div>
                ) : (
                  threads.data?.map((thread: any) => (
                    <button
                      key={thread.id}
                      onClick={async () => {
                        setSelectedThread(thread);
                        await mutationMarkRead({ data: { threadId: thread.id, isOwner: true } });
                        queryClient.invalidateQueries({ queryKey: ["support-threads"] });
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Planos de Assinatura</h2>
            <Button onClick={() => setPlanModal({ 
              name: "", 
              price: 30, 
              duration_value: 30, 
              duration_unit: "days", 
              max_connections: 1 
            })}>
              <Plus className="mr-2 h-4 w-4" /> Novo Plano
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.isLoading ? (
              <div className="col-span-full p-8 text-center text-muted-foreground">Carregando planos...</div>
            ) : (plans.data ?? []).length === 0 ? (
              <div className="col-span-full p-8 text-center text-muted-foreground">Nenhum plano cadastrado.</div>
            ) : (
              plans.data?.map((plan: any) => (
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
        </TabsContent>

        <TabsContent value="referencia" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Links de Indicação / Teste</h2>
            <Button onClick={() => setTestLinkModal({ slug: "", duration_minutes: 360, max_connections: 1, is_active: true })}>
              <Plus className="mr-2 h-4 w-4" /> Novo Link Público
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug / Identificador</TableHead>
                  <TableHead>Criado Por</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Conexões</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testLinks.data?.map((link: any) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-mono text-xs">{link.slug}</TableCell>
                    <TableCell>
                      {link.profile ? (
                        <span className="text-xs font-bold text-primary">@{link.profile.username}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sistema / Dono</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{link.duration_minutes} min</TableCell>
                    <TableCell className="text-xs">{link.max_connections} conn</TableCell>
                    <TableCell>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full", link.is_active ? "bg-online/10 text-online" : "bg-destructive/10 text-destructive")}>
                        {link.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => {
                          const url = `${window.location.origin}/teste/${link.slug}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Link copiado!");
                        }}>
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
                ))}
              </TableBody>
            </Table>
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
              <div className="grid gap-2">
                <Label htmlFor="bulk_action">Ação em Massa para Usuários</Label>
                <Select 
                  value={serverModal?.bulk_action || "none"} 
                  onValueChange={(val) => setServerModal({...serverModal, bulk_action: val})}
                >
                  <SelectTrigger id="bulk_action">
                    <SelectValue placeholder="Escolha uma ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (Apenas salvar servidor)</SelectItem>
                    <SelectItem value="add_to_all">Adicionar este servidor para TODOS os usuários</SelectItem>
                    <SelectItem value="remove_from_all">Remover este servidor de TODOS os usuários</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  * A ação será executada ao clicar em Salvar.
                </p>
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
                <Label>Plano de Assinatura (Opcional)</Label>
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

      {/* Modal Test Link */}
      <Dialog open={!!testLinkModal} onOpenChange={(open) => !open && setTestLinkModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveTestLink}>
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
                  value={testLinkModal?.slug || ""}
                  onChange={(e) => setTestLinkModal({ ...testLinkModal, slug: e.target.value })}
                  placeholder="identificador-unico"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={testLinkModal?.duration_minutes || 240}
                    onChange={(e) => setTestLinkModal({ ...testLinkModal, duration_minutes: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conn">Conexões</Label>
                  <Input
                    id="conn"
                    type="number"
                    value={testLinkModal?.max_connections || 1}
                    onChange={(e) => setTestLinkModal({ ...testLinkModal, max_connections: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
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
                  <Share2 className="h-4 w-4" /> Bonificação por Indicação
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Bônus Mensal (Dias)</Label>
                    <Input 
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
                      type="number" 
                      value={testLinkModal?.bonus_days_quarterly ?? 30}
                      onChange={(e) => setTestLinkModal({ ...testLinkModal, bonus_days_quarterly: parseInt(e.target.value) || 0 })}
                      placeholder="30"
                      className="h-8"
                    />
                    <p className="text-[10px] text-muted-foreground">Para planos {" > "} 30 dias.</p>
                  </div>
                </div>
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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSavePlan}>
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
    </div>
  );
}

function ChatWindow({ thread, onClose }: { thread: any, onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const { data } = await (supabase
        .from('support_messages' as any)
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true }) as any);
      if (data) setMessages(data);
    };
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`thread:${thread.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages', 
        filter: `thread_id=eq.${thread.id}` 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Get attendant name from config
      const { data: configData } = await supabase.from('app_config').select('config').maybeSingle();
      const config = (configData?.config as any) || {};
      const attendantName = config.support_attendant_name || "Suporte";

      const { error } = await (supabase
        .from('support_messages' as any)
        .insert([{
          thread_id: thread.id,
          sender_id: session.user.id,
          content: `${attendantName}: ${newMessage}`
        }]) as any);

      if (error) throw error;

      // Update thread last message
      await (supabase
        .from('support_threads' as any)
        .update({ 
          last_message: newMessage, 
          last_message_at: new Date().toISOString(),
          unread_count_user: (thread.unread_count_user || 0) + 1
        } as any)
        .eq('id', thread.id) as any);

      setNewMessage("");
    } catch (err: any) {
      toast.error("Erro ao enviar: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSending(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chat/${thread.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files-v2')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: signed, error: signErr } = await supabase.storage
        .from('chat-files-v2')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (signErr) throw signErr;
      const publicUrl = signed.signedUrl;

      const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file';

      const { data: { session } } = await supabase.auth.getSession();
      await (supabase.from('support_messages' as any).insert([{
        thread_id: thread.id,
        sender_id: session?.user.id,
        file_url: publicUrl,
        file_type: fileType,
        content: `Enviou um ${fileType}`
      }]) as any);

      toast.success("Arquivo enviado!");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
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
        {messages.map((msg) => {
          const isMe = msg.sender_id === thread.user_id ? false : true;
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"
              )}>
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

