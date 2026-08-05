import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { usePlayerSession } from "@/lib/player-store";
import { listSupportThreads, markThreadRead, getOrCreateThread } from "@/lib/chat.functions";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  MessageSquare,
  Send,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte Técnico | WebPlayer IPTV" },
      { name: "description", content: "Atendimento ao cliente em tempo real." },
    ],
  }),
  component: SuportePage,
});

function SuportePage() {
  const { isOwner, profile } = usePlayerSession();
  const queryClient = useQueryClient();
  const fetchThreads = useServerFn(listSupportThreads);
  const mutationMarkRead = useServerFn(markThreadRead);
  const fetchOrCreateThread = useServerFn(getOrCreateThread);

  const threads = useQuery({
    queryKey: ["support-threads"],
    queryFn: () => fetchThreads(),
    enabled: isOwner,
    refetchInterval: 10000,
  });

  const userThreadQuery = useQuery({
    queryKey: ["support-thread-user", profile?.id],
    queryFn: () => fetchOrCreateThread({ data: { userId: profile!.id } }),
    enabled: !!profile?.id && !isOwner,
  });

  const [selectedThread, setSelectedThread] = useState<any>(null);

  useEffect(() => {
    if (!isOwner && userThreadQuery.data) {
      setSelectedThread(userThreadQuery.data);
    }
  }, [userThreadQuery.data, isOwner]);

  if (!profile && !isOwner) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isOwner ? "Suporte ao Vivo" : "Histórico de Suporte"}</h1>
          <p className="text-muted-foreground">{isOwner ? "Responda seus clientes em tempo real." : "Consulte suas conversas e tire dúvidas."}</p>
        </div>
        <div className="flex items-center gap-2 bg-online/10 text-online px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          <span className="h-2 w-2 rounded-full bg-online" />
          SISTEMA ONLINE
        </div>
      </div>

      <div className={cn("grid gap-6 h-[75vh]", isOwner ? "grid-cols-1 md:grid-cols-12" : "grid-cols-1")}>
        {/* Threads List */}
        {isOwner && (
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
                    onClick={() => {
                      setSelectedThread(thread);
                      mutationMarkRead({ data: { threadId: thread.id, isOwner: true } });
                      queryClient.invalidateQueries({ queryKey: ["support-threads-nav"] });
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
                      <span className="ml-2 bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                        {thread.unread_count_owner}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Chat Window */}
        <Card className={cn("flex flex-col overflow-hidden border-sidebar-border bg-sidebar/20", isOwner ? "md:col-span-8" : "w-full")}>
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
                <p className="text-sm opacity-60">Selecione um cliente ao lado para iniciar o suporte.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
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
    let isMounted = true;
    const fetchMessages = async () => {
      const { data } = await (supabase
        .from('support_messages' as any)
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true }) as any);
      if (data && isMounted) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`thread_owner:${thread.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages', 
        filter: `thread_id=eq.${thread.id}` 
      }, (payload) => {
        if (isMounted) {
          setMessages(prev => {
            if (prev.some(m => m['id'] === payload.new['id'])) return prev;
            return [...prev, payload.new];
          });
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
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

      const { data: msgData, error } = await supabase
        .from('support_messages')
        .insert([{
          thread_id: thread.id,
          sender_id: session.user.id,
          content: `${attendantName}: ${newMessage}`
        }])
        .select()
        .single();

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('support_threads')
        .update({ 
          last_message: newMessage, 
          last_message_at: new Date().toISOString(),
          unread_count_user: (thread.unread_count_user || 0) + 1
        })
        .eq('id', thread.id);
      
      if (updateError) console.error("Erro ao atualizar thread:", updateError);

      if (msgData) {
        setMessages(prev => [...prev, msgData]);
      }
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
      await supabase.from('support_messages').insert([{
        thread_id: thread.id,
        sender_id: session?.user.id || null,
        file_url: publicUrl,
        file_type: fileType,
        content: `Enviou um ${fileType}`
      }]);

      toast.success("Arquivo enviado!");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between bg-sidebar/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black shadow-inner">
            {(thread.profile?.display_name || thread.profile?.username || "S")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight flex items-center gap-2">
              {thread.profile?.display_name || thread.profile?.username || "Suporte Central"}
              {thread.protocol && (
                <span className="text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                  #{thread.protocol}
                </span>
              )}
            </div>
            <div className="text-[10px] text-online font-bold flex items-center gap-1.5 uppercase">
              <span className="h-2 w-2 rounded-full bg-online animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Atendimento Online
            </div>
          </div>
        </div>
        {isOwner && <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive"><X className="h-4 w-4" /></Button>}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        {messages.map((msg) => {
          const isMe = msg.sender_id !== thread.user_id;
          return (
            <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all hover:shadow-lg",
                isMe 
                  ? "bg-primary text-primary-foreground rounded-tr-none border border-primary/20" 
                  : "bg-sidebar-accent/80 border border-sidebar-border rounded-tl-none backdrop-blur-sm"
              )}>
                {msg.file_url ? (
                  <div className="space-y-2 py-1">
                    {msg.file_type === 'image' ? (
                      <img src={msg.file_url} alt="Imagem" className="max-w-full rounded-lg cursor-zoom-in border border-white/10" onClick={() => window.open(msg.file_url)} />
                    ) : msg.file_type === 'audio' ? (
                      <audio controls src={msg.file_url} className="w-full max-w-[240px] h-10" />
                    ) : (
                      <a href={msg.file_url} target="_blank" className="flex items-center gap-2 font-bold underline decoration-primary/50">
                        <ImageIcon className="h-4 w-4" /> Abrir Arquivo
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="leading-relaxed">{msg.content}</p>
                )}
                <div className={cn("text-[9px] mt-1 font-bold opacity-50", isMe ? "text-right" : "text-left")}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-sidebar-border bg-sidebar/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
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
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input 
            placeholder="Escreva sua resposta..." 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="flex-1 bg-sidebar-accent/30 border-sidebar-border focus-visible:ring-primary h-11 rounded-xl shadow-inner"
          />
          <Button type="submit" size="icon" className="h-11 w-11 rounded-full shadow-lg" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
