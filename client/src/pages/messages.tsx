import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Loader2, MailOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface InboxMessage {
  id: number;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export default function MessagesPage() {
  const [, navigate] = useLocation();
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const { data: messages = [], isLoading, isError } = useQuery<InboxMessage[]>({
    queryKey: ["/api/user/messages"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("POST", `/api/user/messages/${messageId}/read`, {});
      return response.json();
    },
    onSuccess: (_data, messageId) => {
      queryClient.setQueryData<InboxMessage[]>(["/api/user/messages"], (current = []) =>
        current.map((message) => message.id === messageId
          ? { ...message, readAt: new Date().toISOString() }
          : message),
      );
    },
  });

  const openMessage = (message: InboxMessage) => {
    setSelectedMessage(message);
    if (!message.readAt) markReadMutation.mutate(message.id);
  };

  return (
    <main className="min-h-[100dvh] bg-[#f0f1fa] text-[#20242c]">
      <header className="relative flex h-12 items-center justify-center bg-[#0b377d] px-14 text-white">
        <button
          type="button"
          onClick={() => navigate("/account")}
          aria-label="Retour"
          data-testid="button-messages-back"
          className="absolute left-0 top-0 grid h-12 w-12 place-items-center text-white"
        >
          <ChevronLeft className="h-7 w-7" strokeWidth={1.8} />
        </button>
        <h1 className="m-0 text-[18px] font-semibold leading-none">Messages</h1>
      </header>

      <section
        aria-label="Boîte de réception"
        className="mx-auto flex min-h-[calc(100dvh-112px)] w-full max-w-[500px] flex-col px-[18px] pb-6 pt-5"
      >
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center" aria-label="Chargement">
            <Loader2 className="h-6 w-6 animate-spin text-[#0b377d]" />
          </div>
        ) : isError ? (
          <div className="flex flex-1 items-center justify-center text-center font-serif text-[17px] tracking-[0.18em] text-[#9a9ba2]">
            IMPOSSIBLE DE CHARGER
          </div>
        ) : messages.length === 0 ? (
          <div
            className="flex flex-1 items-center justify-center pb-3 font-serif text-[23px] font-semibold tracking-[0.2em] text-[#aaaab1]"
            data-testid="messages-empty-state"
          >
            AUCUN MESSAGE
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => openMessage(message)}
                className="flex w-full items-center gap-3 rounded-xl bg-white px-4 py-4 text-left shadow-[0_1px_5px_rgba(20,35,65,.08)]"
                data-testid={`inbox-message-${message.id}`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${message.readAt ? "bg-[#eef1f7] text-[#7e8794]" : "bg-[#e6edf9] text-[#0b377d]"}`}>
                  <MailOpen className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <strong className={`truncate text-[15px] ${message.readAt ? "font-medium" : "font-bold"}`}>{message.title}</strong>
                    {!message.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-[#0b377d]" aria-label="Non lu" />}
                  </span>
                  <span className="mt-1 block truncate text-[13px] text-[#777e89]">{message.body}</span>
                  <span className="mt-2 block text-[11px] text-[#9298a2]">
                    {new Date(message.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#aab0ba]" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-[calc(100%-32px)] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0b377d]">{selectedMessage?.title}</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap break-words text-[15px] leading-6 text-[#454b55]">
            {selectedMessage?.body}
          </div>
          <p className="text-right text-xs text-muted-foreground">
            {selectedMessage?.createdAt && new Date(selectedMessage.createdAt).toLocaleString("fr-FR")}
          </p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
