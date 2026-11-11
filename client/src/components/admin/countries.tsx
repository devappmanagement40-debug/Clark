import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Pencil, Check, X, Globe } from "lucide-react";
import { parseCountryMethodEntries, type CountryMethodEntry } from "@shared/country-methods";
import type { Country } from "@shared/schema";

interface CountryForm {
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
  operators: CountryMethodEntry[];
  withdrawalMethods: CountryMethodEntry[];
  isActive: boolean;
}

const emptyForm: CountryForm = {
  code: "",
  name: "",
  currency: "XOF",
  phonePrefix: "",
  operators: [],
  withdrawalMethods: [],
  isActive: true,
};

function CountryMethodEditor({
  title,
  description,
  value,
  onChange,
  testId,
}: {
  title: string;
  description: string;
  value: CountryMethodEntry[];
  onChange: (methods: CountryMethodEntry[]) => void;
  testId: string;
}) {
  const [newName, setNewName] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const addMethod = () => {
    const name = newName.trim();
    if (!name) return;
    const existingIndex = value.findIndex((method) => method.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (existingIndex >= 0) {
      onChange(value.map((method, index) => index === existingIndex ? { ...method, isActive: true } : method));
    } else {
      onChange([...value, { name, isActive: true }]);
    }
    setNewName("");
  };

  const saveEdit = (index: number) => {
    const name = editingName.trim();
    if (!name) return;
    const duplicate = value.some((entry, entryIndex) =>
      entryIndex !== index && entry.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (duplicate) return;
    onChange(value.map((entry, entryIndex) => entryIndex === index ? { ...entry, name } : entry));
    setEditingIndex(null);
    setEditingName("");
  };

  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addMethod();
            }
          }}
          placeholder="Nom du moyen"
          maxLength={48}
          data-testid={`${testId}-input`}
        />
        <Button type="button" variant="outline" size="icon" onClick={addMethod} aria-label={`Ajouter : ${title}`} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {value.map((method, index) => (
          <div key={`${method.name.toLocaleLowerCase()}-${index}`} className="flex items-center gap-2 rounded-lg border p-2">
            {editingIndex === index ? (
              <>
                <Input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      saveEdit(index);
                    } else if (event.key === "Escape") {
                      setEditingIndex(null);
                      setEditingName("");
                    }
                  }}
                  maxLength={48}
                  autoFocus
                  aria-label={`Modifier ${method.name}`}
                  data-testid={`${testId}-edit-input-${index}`}
                />
                <Button type="button" size="icon" variant="outline" onClick={() => saveEdit(index)} aria-label="Enregistrer le nom">
                  <Check className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => { setEditingIndex(null); setEditingName(""); }} aria-label="Annuler la modification">
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <span className={`min-w-0 flex-1 break-words text-sm ${method.isActive ? "" : "text-muted-foreground line-through"}`}>
                  {method.name}
                </span>
                <span className="text-xs text-muted-foreground">{method.isActive ? "Actif" : "Désactivé"}</span>
                <Switch
                  checked={method.isActive}
                  onCheckedChange={(isActive) => onChange(value.map((entry, entryIndex) => entryIndex === index ? { ...entry, isActive } : entry))}
                  aria-label={`${method.isActive ? "Désactiver" : "Activer"} ${method.name}`}
                  data-testid={`${testId}-toggle-${index}`}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => { setEditingIndex(index); setEditingName(method.name); }}
                  aria-label={`Modifier ${method.name}`}
                  data-testid={`${testId}-edit-${index}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
        {value.length === 0 && <p className="text-xs text-muted-foreground">Aucun moyen configuré.</p>}
      </div>
    </div>
  );
}

export default function AdminCountries() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CountryForm>(emptyForm);

  const { data: countriesList, isLoading } = useQuery<Country[]>({
    queryKey: ["/api/admin/countries"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CountryForm) => {
      const payload = {
        ...data,
        operators: JSON.stringify(data.operators),
        withdrawalMethods: JSON.stringify(data.withdrawalMethods),
      };
      if (editingId) {
        const res = await apiRequest("PUT", `/api/admin/countries/${editingId}`, payload);
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/countries", payload);
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/login/countries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deposit/methods"] });
      toast({ title: editingId ? "Pays mis à jour!" : "Pays ajouté!" });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (e: any) => {
      toast({ title: editingId ? "Modification du pays impossible" : "Ajout du pays impossible", description: e.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/countries/${id}`, { isActive });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/login/countries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deposit/methods"] });
      toast({ title: isActive ? "Pays activé" : "Pays désactivé" });
    },
    onError: (error: Error) => {
      toast({
        title: "Modification du pays impossible",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEdit = (c: Country) => {
    setForm({
      code: c.code,
      name: c.name,
      currency: c.currency,
      phonePrefix: c.phonePrefix,
      operators: parseCountryMethodEntries(c.operators),
      withdrawalMethods: parseCountryMethodEntries(c.withdrawalMethods),
      isActive: c.isActive,
    });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Gestion des Pays ({countriesList?.length ?? 0})
        </h2>
        <Button onClick={openAdd} size="sm" data-testid="button-add-country">
          <Plus className="w-4 h-4 mr-1" />
          Ajouter un pays
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Chargement...</p>}

      <div className="grid gap-3">
        {countriesList?.map((c) => {
          const ops = parseCountryMethodEntries(c.operators);
          const withdrawals = parseCountryMethodEntries(c.withdrawalMethods);
          return (
            <Card key={c.id} data-testid={`card-country-${c.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-base">{c.name}</span>
                      <Badge variant="outline" className="text-xs">{c.code}</Badge>
                      <Badge variant="secondary" className="text-xs">{c.currency}</Badge>
                      <Badge variant={c.isActive ? "default" : "secondary"} className="text-xs">
                        {c.isActive ? "Actif" : "Désactivé"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Indicatif: +{c.phonePrefix}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Dépôt</p>
                      <div className="flex flex-wrap gap-1">
                        {ops.length > 0 ? ops.map((method) => (
                          <Badge key={`deposit-${method.name}`} variant={method.isActive ? "outline" : "secondary"} className={`text-xs font-normal ${method.isActive ? "" : "line-through"}`}>{method.name}</Badge>
                        )) : <span className="text-xs text-muted-foreground">Non configuré</span>}
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Retrait</p>
                      <div className="flex flex-wrap gap-1">
                        {withdrawals.length > 0 ? withdrawals.map((method) => (
                          <Badge key={`withdrawal-${method.name}`} variant={method.isActive ? "outline" : "secondary"} className={`text-xs font-normal ${method.isActive ? "" : "line-through"}`}>{method.name}</Badge>
                        )) : <span className="text-xs text-muted-foreground">Non configuré</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={c.isActive}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, isActive: v })}
                      disabled={toggleMutation.isPending}
                      aria-label={`${c.isActive ? "Désactiver" : "Activer"} ${c.name}`}
                      data-testid={`switch-country-active-${c.id}`}
                    />
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)} data-testid={`button-edit-country-${c.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {countriesList?.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">Aucun pays configuré</p>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setEditingId(null); setForm(emptyForm); }}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le pays" : "Ajouter un pays"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Code pays (ex: TD)</Label>
                <Input
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="TD"
                  maxLength={3}
                  disabled={!!editingId}
                  required
                  data-testid="input-country-code"
                />
              </div>
              <div>
                <Label>Devise (ex: XAF)</Label>
                <Input
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                  placeholder="XAF"
                  maxLength={5}
                  required
                  data-testid="input-country-currency"
                />
              </div>
            </div>
            <div>
              <Label>Nom du pays</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Tchad"
                required
                data-testid="input-country-name"
              />
            </div>
            <div>
              <Label>Indicatif téléphonique (sans +)</Label>
              <Input
                value={form.phonePrefix}
                onChange={e => setForm({ ...form, phonePrefix: e.target.value })}
                placeholder="235"
                required
                data-testid="input-country-prefix"
              />
            </div>
            <CountryMethodEditor
              title="Moyens de dépôt"
              description="Configure les opérateurs proposés pour ce pays. Pour recevoir les dépôts, ajoute aussi le numéro ou lien destinataire dans les numéros de paiement."
              value={form.operators}
              onChange={(operators) => setForm({ ...form, operators })}
              testId="country-deposit-method"
            />
            <CountryMethodEditor
              title="Moyens de retrait"
              description="Cette liste pilote les moyens disponibles lors de l’enregistrement du portefeuille et du retrait. Désactive un moyen sans effacer sa configuration."
              value={form.withdrawalMethods}
              onChange={(withdrawalMethods) => setForm({ ...form, withdrawalMethods })}
              testId="country-withdrawal-method"
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm({ ...form, isActive: v })}
                id="country-active"
              />
              <Label htmlFor="country-active">Pays actif</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); }}>
                Annuler
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-country">
                {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
