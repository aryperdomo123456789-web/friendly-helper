import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Filter, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cleanupAdminPaymentOrders, deleteSelectedAdminPaymentOrders, listAdminPaymentsPage } from "@/lib/admin-payments.functions";

const statusLabels: Record<string, string> = { pending: "Pendente", processing: "Processando", approved: "Aprovado", rejected: "Rejeitado", cancelled: "Cancelado", refunded: "Estornado", chargeback: "Chargeback", expired: "Expirado", error: "Erro", simulated: "Simulado" };
const statusClasses: Record<string, string> = { approved: "border-emerald-500/40 text-emerald-400", pending: "border-amber-500/40 text-amber-400", processing: "border-blue-500/40 text-blue-400", rejected: "border-red-500/40 text-red-400", error: "border-red-500/40 text-red-400", refunded: "border-purple-500/40 text-purple-400", chargeback: "border-red-500/40 text-red-400" };
const deletableStatuses = new Set(["pending", "rejected", "cancelled", "expired", "error", "simulated"]);

function canSelectPayment(item: any) {
  return deletableStatuses.has(item.status) && !item.approved_at;
}

export function PaymentsManagementModule({ isOwner }: { isOwner: boolean }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [cleanupConfirm, setCleanupConfirm] = useState(false);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());
  const [selectedDeleteConfirm, setSelectedDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchPayments = useServerFn(listAdminPaymentsPage);
  const cleanupPayments = useServerFn(cleanupAdminPaymentOrders);
  const deleteSelectedPayments = useServerFn(deleteSelectedAdminPaymentOrders);
  const payments = useQuery({
    queryKey: ["admin-payments", page, status, appliedSearch],
    queryFn: () => fetchPayments({ data: { page, page_size: 25, status, search: appliedSearch } }),
    enabled: isOwner,
    placeholderData: (previous) => previous,
  });
  const pendingPayments = useQuery({
    queryKey: ["admin-pending-payment-count"],
    queryFn: () => fetchPayments({ data: { page: 1, page_size: 1, status: "pending", search: "" } }),
    enabled: isOwner,
    staleTime: 15_000,
  });
  const items = payments.data?.items ?? [];
  const total = payments.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 25));
  const selectableItems = items.filter(canSelectPayment);
  const selectedCount = selectedPaymentIds.size;
  const allSelectableSelected = selectableItems.length > 0 && selectableItems.every((item: any) => selectedPaymentIds.has(item.id));
  const someSelectableSelected = selectableItems.some((item: any) => selectedPaymentIds.has(item.id)) && !allSelectableSelected;
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelectableSelected;
  }, [someSelectableSelected]);

  useEffect(() => {
    setSelectedPaymentIds(new Set());
  }, [page, status, appliedSearch]);

  const runCleanup = async () => {
    setLoading(true);
    try {
      const result = await cleanupPayments({ data: { before: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() } });
      toast.success(result.count + " ordem(ns) antiga(s) removida(s). Pagamentos aprovados foram preservados.");
      setCleanupConfirm(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-payments"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-pending-payment-count"] }),
      ]);
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível limpar as ordens.");
    } finally {
      setLoading(false);
    }
  };

  const runSelectedDelete = async () => {
    const ids = [...selectedPaymentIds];
    if (!ids.length) return;
    setLoading(true);
    try {
      const result = await deleteSelectedPayments({ data: { selectedPaymentIds: ids } });
      toast.success(`${result.deletedCount} ordem(ns) excluída(s). ${result.skippedCount ? `${result.skippedCount} protegida(s) foram mantidas.` : ""}`.trim());
      setSelectedPaymentIds(new Set());
      setSelectedDeleteConfirm(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-payments"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-pending-payment-count"] }),
      ]);
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível excluir as ordens selecionadas.");
    } finally {
      setLoading(false);
    }
  };

  const togglePayment = (id: string, checked: boolean) => {
    setSelectedPaymentIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllOnPage = (checked: boolean) => {
    setSelectedPaymentIds((current) => {
      const next = new Set(current);
      selectableItems.forEach((item: any) => checked ? next.add(item.id) : next.delete(item.id));
      return next;
    });
  };

  return (
    <Card className="border-sidebar-border bg-sidebar/20">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Histórico de pagamentos</CardTitle><p className="mt-1 text-sm text-muted-foreground">Ordens geradas, Pix/cartão, status do Mercado Pago e rastreabilidade.</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void payments.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>{selectedCount > 0 ? <Button variant="destructive" onClick={() => setSelectedDeleteConfirm(true)}><Trash2 className="mr-2 h-4 w-4" />Excluir selecionados ({selectedCount})</Button> : null}<Button variant="outline" className="text-amber-400" onClick={() => setCleanupConfirm(true)}><Trash2 className="mr-2 h-4 w-4" />Limpar pendentes antigas</Button></div>
        </div>
        <div className="grid gap-2 md:grid-cols-[1fr_190px_auto]">
          <div className="flex gap-2"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, preferência ou referência externa" onKeyDown={(event) => { if (event.key === "Enter") { setPage(1); setAppliedSearch(search.trim()); } }} /><Button variant="outline" onClick={() => { setPage(1); setAppliedSearch(search.trim()); }}><Search className="h-4 w-4" /></Button></div>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          <div className="flex items-center justify-end text-sm text-muted-foreground">{total} ordem(ns)</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-sidebar-border">
          <table className="w-full text-sm"><thead className="bg-sidebar/40 text-left text-muted-foreground"><tr><th className="w-12 p-3"><input ref={selectAllRef} type="checkbox" aria-label="Selecionar todas as ordens elegíveis desta página" checked={allSelectableSelected} disabled={!selectableItems.length || loading} onChange={(event) => toggleAllOnPage(event.target.checked)} /></th><th className="p-3">Data</th><th className="p-3">Cliente</th><th className="p-3">Plano</th><th className="p-3">Valor</th><th className="p-3">Provedor</th><th className="p-3">Status</th><th className="p-3">Referência</th></tr></thead>
            <tbody>{payments.isLoading ? <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Carregando ordens...</td></tr> : items.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhuma ordem encontrada.</td></tr> : items.map((item: any) => <tr key={item.id} className="border-t border-sidebar-border/70 align-top"><td className="p-3"><input type="checkbox" aria-label={`Selecionar pagamento ${item.id}`} checked={selectedPaymentIds.has(item.id)} disabled={!canSelectPayment(item) || loading} onChange={(event) => togglePayment(item.id, event.target.checked)} /></td><td className="whitespace-nowrap p-3">{new Date(item.created_at).toLocaleString("pt-BR")}</td><td className="p-3"><div className="font-medium">{item.profile?.display_name || item.profile?.username || "Usuário"}</div><div className="text-xs text-muted-foreground">{item.user_id}</div></td><td className="p-3">{item.plan?.name || "Plano removido"}</td><td className="whitespace-nowrap p-3 font-semibold">R$ {Number(item.amount).toFixed(2).replace(".", ",")}</td><td className="p-3">{item.provider}</td><td className="p-3"><Badge variant="outline" className={statusClasses[item.status] || ""}>{statusLabels[item.status] || item.status}</Badge>{item.approved_at ? <div className="mt-1 text-xs text-muted-foreground">Aprovado {new Date(item.approved_at).toLocaleString("pt-BR")}</div> : null}</td><td className="max-w-[240px] p-3 text-xs"><div className="break-all">{item.external_reference || item.provider_payment_id || item.provider_preference_id || "—"}</div>{item.last_error ? <div className="mt-1 text-red-400">{item.last_error}</div> : null}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted-foreground">Página {Math.min(page, totalPages)} de {totalPages}</span><div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button><Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Próxima</Button></div></div>
      </CardContent>
      <ConfirmDialog open={cleanupConfirm} title="Limpar ordens pendentes antigas" description={`Serão removidas ${pendingPayments.data?.total ?? 0} ordem(ns) com mais de 30 dias e status Pendente. Pagamentos em processamento, aprovados, rejeitados, estornados e chargebacks serão preservados.`} confirmLabel="Limpar pendentes" variant="warning" isLoading={loading} onConfirm={() => void runCleanup()} onClose={() => { if (!loading) setCleanupConfirm(false); }} />
      <ConfirmDialog open={selectedDeleteConfirm} title="Excluir ordens selecionadas" description={`Você selecionou ${selectedCount} ordem(ns). Serão excluídas apenas ordens não financeiras elegíveis. Pagamentos aprovados, processando ou que já concederam acesso serão preservados automaticamente.`} confirmLabel="Excluir selecionados" variant="destructive" isLoading={loading} onConfirm={() => void runSelectedDelete()} onClose={() => { if (!loading) setSelectedDeleteConfirm(false); }} />
    </Card>
  );
}
