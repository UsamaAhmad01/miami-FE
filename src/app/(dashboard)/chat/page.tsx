"use client";

import { useState } from "react";
import { Send, Search, Phone, Mail, Wrench, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/primitives/page-shell";
import { BrandedLoader } from "@/components/brand/branded-loader";
import { useAuthStore } from "@/stores/auth-store";
import { useAllChats, useFetchChatRecord, useShowSms, useSendSms } from "@/hooks/use-api";
import { toast } from "sonner";

export default function ChatPage() {
  const { user } = useAuthStore();
  const branch = user?.branch_name || "";
  const { data: chats, isLoading } = useAllChats(branch);
  const [selectedInv, setSelectedInv] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [messageText, setMessageText] = useState("");

  const { data: ticketRecord } = useFetchChatRecord(selectedInv);
  const { data: messages } = useShowSms(selectedInv);
  const sendSms = useSendSms();

  const allChats = (chats || []) as Array<Record<string, unknown>>;
  const filteredChats = chatSearch ? allChats.filter((c) => String(c.name || "").toLowerCase().includes(chatSearch.toLowerCase()) || String(c.phone_no || "").includes(chatSearch)) : allChats;
  const phoneNumber = String(ticketRecord?.phone_no || "");

  const handleSend = async () => {
    if (!messageText.trim() || !phoneNumber || !selectedInv) return;
    try { await sendSms.mutateAsync({ to_number: phoneNumber, body_msg: messageText, inv: selectedInv }); setMessageText(""); } catch { toast.error("Failed to send"); }
  };

  return (
    <PageShell>
      <div className="flex h-[calc(100vh-8rem)] rounded-lg border bg-card overflow-hidden">
        {/* Left — Chat List */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} placeholder="Search chats..." className="pl-9 h-8 text-xs" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? <BrandedLoader variant="inline" text="Loading..." /> : filteredChats.map((chat, i) => {
              const inv = String(chat.automatic_generated_invoice_number || "");
              return (
                <button key={i} onClick={() => setSelectedInv(inv)} className={`flex items-center gap-3 w-full px-3 py-3 text-left border-b hover:bg-muted/30 transition-colors ${selectedInv === inv ? "bg-primary/5" : ""}`}>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">{String(chat.name || "?")[0]}</div>
                  <div className="min-w-0"><p className="text-xs font-medium truncate">{String(chat.name || "Unknown")}</p><p className="text-[10px] text-muted-foreground">{String(chat.phone_no || "")}</p></div>
                </button>
              );
            })}
          </div>

          {/* Ticket details sidebar */}
          {ticketRecord && (
            <div className="border-t p-3 space-y-2 text-xs">
              <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">Ticket Details</p>
              {typeof ticketRecord.email === "string" && ticketRecord.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground" /><span>{ticketRecord.email}</span></div>}
              {typeof ticketRecord.phone_no === "string" && ticketRecord.phone_no && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" /><span>{ticketRecord.phone_no}</span></div>}
              {typeof ticketRecord.description === "string" && ticketRecord.description && <div className="flex items-center gap-1.5"><FileText className="h-3 w-3 text-muted-foreground" /><span className="truncate">{ticketRecord.description}</span></div>}
            </div>
          )}
        </div>

        {/* Right — Conversation */}
        <div className="flex-1 flex flex-col">
          {!selectedInv ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a conversation</div>
          ) : (
            <>
              <div className="p-3 border-b"><p className="text-sm font-medium">{String(ticketRecord?.name || selectedInv)}</p><p className="text-[10px] text-muted-foreground">{phoneNumber}</p></div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages || []).map((msg, i) => {
                  const isAdmin = msg.direction === "outbound" || msg.sender === "admin";
                  return (
                    <div key={i} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${isAdmin ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p>{String(msg.body || msg.message || "")}</p>
                        <p className={`text-[9px] mt-1 ${isAdmin ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{String(msg.created_at || msg.timestamp || "")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t flex gap-2">
                <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} placeholder="Type a message..." className="h-9 text-sm" />
                <Button onClick={handleSend} disabled={sendSms.isPending || !messageText.trim()} className="h-9 px-4"><Send className="h-3.5 w-3.5" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
