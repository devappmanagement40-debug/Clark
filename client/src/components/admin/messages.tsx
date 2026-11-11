import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Search, Send, Users } from "lucide-react";

interface Recipient {
  id: number;
  fullName: string;
  phone: string;
  country: string;
}

interface MessageCampaign {
  id: number;
  title: string;
  body: string;
  recipientCount: number;
  createdAt: string;
}

export default function AdminMessages() {
  const { toast } = useToast();
  const [targetMode, setTargetMode] = useState<"all" | "user">("all");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<MessageCampaign[]>({
    queryKey: ["/api/admin/messages"],
  });
  const { data: recipients = [], isFetching: recipientsLoading } = useQuery<Recipient[]>({
    queryKey: ["/api/admin/messages/recipients", recipientSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (recipientSearch.trim()) params.set("search", recipientSearch.trim());
      const response = await fetch(`/api/admin/messages/recipients?${params}`, { credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "La recherche des utilisateurs a échoué.");
      }
      return response.json();
    },
    enabled: targetMode === "user" && recipientSearch.trim().length >= 2 && !selectedRecipient,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/messages", {
        title,
        body,
        targetUserId: targetMode === "user" ? selectedRecipient?.id : null,
      });
      return response.json();
    },
    onSuccess: (result: { campaign: MessageCampaign }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      setTitle("");
      setBody("");
      setRecipientSearch("");
      setSelectedRecipient(null);
      toast({
        title: "Message envoyé",
        description: `Le message a été ajouté à la boîte de réception de ${result.campaign.recipientCount} utilisateur${result.campaign.recipientCount > 1 ? "s" : ""}.`,
      });
    },
    onError: (error: Error) => toast({
      title: "Envoi impossible",
      description: error.message,
      variant: "destructive",
    }),
  });

  const canSend = title.trim().length >= 2
    && body.trim().length >= 2
    && (targetMode === "all" || !!selectedRecipient)
    && !sendMutation.isPending;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            Nouveau message
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Le message apparaîtra dans l’application. Aucun SMS ni e-mail ne sera envoyé.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSend) sendMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>Destinataires</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={targetMode === "all" ? "default" : "outline"}
                  className={targetMode === "all" ? "bg-[#0b377d] hover:bg-[#082d68]" : ""}
                  onClick={() => {
                    setTargetMode("all");
                    setSelectedRecipient(null);
                    setRecipientSearch("");
                  }}
                  data-testid="message-target-all"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Tous
                </Button>
                <Button
                  type="button"
                  variant={targetMode === "user" ? "default" : "outline"}
                  className={targetMode === "user" ? "bg-[#0b377d] hover:bg-[#082d68]" : ""}
                  onClick={() => setTargetMode("user")}
                  data-testid="message-target-user"
                >
                  Un utilisateur
                </Button>
              </div>
            </div>

            {targetMode === "user" && (
              <div className="space-y-2">
                <Label htmlFor="message-recipient-search">Rechercher un utilisateur</Label>
                {selectedRecipient ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{selectedRecipient.fullName}</p>
                      <p className="text-xs text-muted-foreground">{selectedRecipient.phone} · {selectedRecipient.country}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRecipient(null);
                        setRecipientSearch("");
                      }}
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="message-recipient-search"
                        value={recipientSearch}
                        onChange={(event) => setRecipientSearch(event.target.value)}
                        placeholder="Nom ou numéro de téléphone"
                        className="pl-9"
                        data-testid="message-recipient-search"
                      />
                    </div>
                    {recipientSearch.trim().length < 2 ? (
                      <p className="text-xs text-muted-foreground">Saisissez au moins 2 caractères pour lancer la recherche.</p>
                    ) : (
                      <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1">
                        {recipientsLoading ? (
                          <div className="flex justify-center p-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
                        ) : recipients.length ? recipients.map((recipient) => (
                          <button
                            key={recipient.id}
                            type="button"
                            className="w-full rounded-md px-3 py-2 text-left hover:bg-muted"
                            onClick={() => setSelectedRecipient(recipient)}
                          >
                            <span className="block text-sm font-medium">{recipient.fullName}</span>
                            <span className="block text-xs text-muted-foreground">{recipient.phone} · {recipient.country}</span>
                          </button>
                        )) : (
                          <p className="p-3 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message-title">Titre</Label>
              <Input
                id="message-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
                placeholder="Titre du message"
                data-testid="message-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message-body">Message</Label>
              <Textarea
                id="message-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Écrivez le message à afficher dans la boîte de réception."
                data-testid="message-body"
              />
              <p className="text-right text-xs text-muted-foreground">{body.length}/5000</p>
            </div>
            <Button
              type="submit"
              disabled={!canSend}
              className="w-full bg-[#0b377d] hover:bg-[#082d68]"
              data-testid="message-send"
            >
              {sendMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Envoyer le message
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Messages envoyés</h2>
        {campaignsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : campaigns.length ? campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{campaign.title}</h3>
                <span className="shrink-0 rounded-full bg-[#e8eef8] px-2.5 py-1 text-xs font-medium text-[#0b377d]">
                  {campaign.recipientCount} destinataire{campaign.recipientCount > 1 ? "s" : ""}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{campaign.body}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(campaign.createdAt).toLocaleString("fr-FR")}
              </p>
            </CardContent>
          </Card>
        )) : (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Aucun message envoyé pour l’instant.</CardContent></Card>
        )}
      </section>
    </div>
  );
}
