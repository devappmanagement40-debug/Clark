import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminWheelRewards from "@/components/admin/admin-wheel-rewards";
import {
  wheelConfigurationSchema,
  type WheelConfiguration,
  type WheelPrizeConfiguration,
} from "@shared/wheel-config";

const MAX_PRIZE_IMAGE_BYTES = 256 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function createPrizeId() {
  return `prize-${crypto.randomUUID()}`;
}

export default function AdminWheelSettings() {
  const { toast } = useToast();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [draft, setDraft] = useState<WheelConfiguration>({
    buyerSpinsPerPurchase: 0,
    referralSpinsPerPurchase: 0,
    prizes: [],
  });
  const configQuery = useQuery<WheelConfiguration>({
    queryKey: ["/api/admin/wheel/config"],
  });

  useEffect(() => {
    if (configQuery.data) setDraft(configQuery.data);
  }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = wheelConfigurationSchema.safeParse(draft);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Vérifiez la configuration des lots.");
      const response = await apiRequest("PUT", "/api/admin/wheel/config", parsed.data);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "La configuration de la roue n’a pas pu être enregistrée.");
      }
      return response.json() as Promise<WheelConfiguration>;
    },
    onSuccess: (savedConfiguration) => {
      setDraft(savedConfiguration);
      queryClient.setQueryData(["/api/admin/wheel/config"], savedConfiguration);
      void queryClient.invalidateQueries({ queryKey: ["/api/wheel/config"] });
      toast({ title: "Configuration de la roue enregistrée" });
    },
    onError: (error: Error) => toast({
      title: "Enregistrement impossible",
      description: error.message,
      variant: "destructive",
    }),
  });

  const updateConfiguration = (update: Partial<WheelConfiguration>) => {
    setDraft((current) => ({ ...current, ...update }));
  };

  const updatePrize = (id: string, update: Partial<WheelPrizeConfiguration>) => {
    setDraft((current) => ({
      ...current,
      prizes: current.prizes.map((prize) => prize.id === id ? { ...prize, ...update } : prize),
    }));
  };

  const movePrize = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= draft.prizes.length) return;
    const prizes = [...draft.prizes];
    [prizes[index], prizes[destination]] = [prizes[destination], prizes[index]];
    updateConfiguration({ prizes });
  };

  const handleImageChange = (id: string, file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: "Format non pris en charge", description: "Choisissez une image PNG, JPG ou WebP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_PRIZE_IMAGE_BYTES) {
      toast({ title: "Image trop volumineuse", description: "Chaque image doit faire 256 Ko maximum.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") updatePrize(id, { imageUrl: reader.result });
      else toast({ title: "Lecture impossible", description: "Impossible de lire cette image.", variant: "destructive" });
    };
    reader.onerror = () => toast({ title: "Lecture impossible", description: "Impossible de lire cette image.", variant: "destructive" });
    reader.readAsDataURL(file);
  };

  const addPrize = () => {
    if (draft.prizes.length >= 20) {
      toast({ title: "Limite atteinte", description: "Vous pouvez configurer jusqu’à 20 lots.", variant: "destructive" });
      return;
    }
    const prize: WheelPrizeConfiguration = {
      id: createPrizeId(),
      title: "Nouveau lot",
      kind: "physical",
      amount: null,
      currency: "XOF",
      imageUrl: null,
      probability: 0,
      active: false,
    };
    updateConfiguration({ prizes: [...draft.prizes, prize] });
  };

  const togglePrize = (prize: WheelPrizeConfiguration) => {
    updatePrize(prize.id, {
      active: !prize.active,
      probability: prize.active ? 0 : Math.max(0.01, prize.probability),
    });
  };

  const validation = wheelConfigurationSchema.safeParse(draft);
  const activeProbability = draft.prizes
    .filter((prize) => prize.active)
    .reduce((sum, prize) => sum + prize.probability, 0);
  const validationMessage = validation.success ? "" : validation.error.issues[0]?.message || "";

  if (configQuery.isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-24" />)}</div>;
  }

  if (configQuery.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-destructive">Impossible de charger la configuration de la roue.</p>
          <Button variant="outline" onClick={() => void configQuery.refetch()}>Réessayer</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nombre de tours attribués</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ces valeurs s’appliquent uniquement aux nouveaux achats payants confirmés. Les achats gratuits et attribués par l’administration ne donnent pas de tour.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium">
            Tours pour l’acheteur, par achat
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={draft.buyerSpinsPerPurchase}
              onChange={(event) => updateConfiguration({ buyerSpinsPerPurchase: Math.max(0, Math.min(100, Number(event.target.value) || 0)) })}
              data-testid="input-wheel-buyer-spins"
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            Tours pour le parrain direct, par achat du filleul
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={draft.referralSpinsPerPurchase}
              onChange={(event) => updateConfiguration({ referralSpinsPerPurchase: Math.max(0, Math.min(100, Number(event.target.value) || 0)) })}
              data-testid="input-wheel-referral-spins"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-3 sm:flex-row">
          <div className="space-y-1">
            <CardTitle>Lots et probabilités</CardTitle>
            <p className="text-sm text-muted-foreground">
              Les probabilités des lots actifs doivent totaliser 100 %. Tous les lots restent visibles sur la roue; un lot désactivé ne peut jamais être gagné.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addPrize} disabled={draft.prizes.length >= 20} data-testid="button-add-wheel-prize">
            <Plus className="mr-2 h-4 w-4" /> Ajouter un lot
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span>Probabilité active totale</span>
            <strong className={Math.abs(activeProbability - 100) <= 0.01 ? "text-emerald-700" : "text-destructive"}>
              {activeProbability.toFixed(2)} %
            </strong>
          </div>

          {draft.prizes.map((prize, index) => (
            <Card key={prize.id} className={prize.active ? "border-blue-200" : "opacity-75"}>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#0b3679]"
                      checked={prize.active}
                      onChange={() => togglePrize(prize)}
                      aria-label={`${prize.active ? "Désactiver" : "Activer"} ${prize.title}`}
                      data-testid={`switch-wheel-prize-${prize.id}`}
                    />
                    <span className="text-sm font-semibold">{prize.active ? "Lot actif" : "Lot désactivé"}</span>
                    {prize.active && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-800">{prize.probability}%</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" aria-label="Monter le lot" disabled={index === 0} onClick={() => movePrize(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" aria-label="Descendre le lot" disabled={index === draft.prizes.length - 1} onClick={() => movePrize(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Supprimer ${prize.title}`}
                      onClick={() => updateConfiguration({ prizes: draft.prizes.filter((item) => item.id !== prize.id) })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5 text-sm font-medium">
                    Type de lot
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={prize.kind}
                      onChange={(event) => updatePrize(prize.id, {
                        kind: event.target.value as WheelPrizeConfiguration["kind"],
                        amount: event.target.value === "cash" ? (prize.amount ?? 1) : null,
                        title: event.target.value === "cash" ? "Gain en espèces" : prize.title,
                      })}
                    >
                      <option value="cash">Montant en espèces</option>
                      <option value="physical">Lot matériel</option>
                    </select>
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">
                    Nom du lot
                    <Input value={prize.title} maxLength={60} onChange={(event) => updatePrize(prize.id, { title: event.target.value })} />
                  </label>
                  {prize.kind === "cash" && (
                    <>
                      <label className="block space-y-1.5 text-sm font-medium">
                        Montant
                        <Input type="number" min={1} max={1_000_000_000} step={1} value={prize.amount ?? ""} onChange={(event) => updatePrize(prize.id, { amount: Math.max(1, Number(event.target.value) || 1) })} />
                      </label>
                      <label className="block space-y-1.5 text-sm font-medium">
                        Devise
                        <Input value={prize.currency} maxLength={6} onChange={(event) => updatePrize(prize.id, { currency: event.target.value.toUpperCase() })} />
                      </label>
                    </>
                  )}
                  <label className="block space-y-1.5 text-sm font-medium">
                    Probabilité en pourcentage
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={prize.probability}
                      disabled={!prize.active}
                      onChange={(event) => updatePrize(prize.id, { probability: Math.max(0, Math.min(100, Number(event.target.value) || 0)) })}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Image du lot</label>
                  <input
                    ref={(element) => { fileInputRefs.current[prize.id] = element; }}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      handleImageChange(prize.id, event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => fileInputRefs.current[prize.id]?.click()}>
                      <ImagePlus className="mr-2 h-4 w-4" /> {prize.imageUrl ? "Remplacer l’image" : "Choisir une image"}
                    </Button>
                    {prize.imageUrl && (
                      <Button type="button" variant="ghost" onClick={() => updatePrize(prize.id, { imageUrl: null })}>Retirer l’image</Button>
                    )}
                  </div>
                  <Input
                    value={prize.imageUrl?.startsWith("data:") ? "" : prize.imageUrl ?? ""}
                    placeholder="Ou collez une URL HTTPS"
                    onChange={(event) => updatePrize(prize.id, { imageUrl: event.target.value.trim() || null })}
                  />
                  {prize.imageUrl && (
                    <img src={prize.imageUrl} alt={`Aperçu : ${prize.title}`} className="h-20 w-28 rounded-md border bg-white object-contain p-1" />
                  )}
                  <p className="text-xs text-muted-foreground">PNG, JPG ou WebP, 256 Ko maximum par image.</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {validationMessage && <p className="text-sm text-destructive" role="alert">{validationMessage}</p>}
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => saveMutation.mutate()}
            disabled={!validation.success || saveMutation.isPending}
            data-testid="button-save-wheel-config"
          >
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer la configuration
          </Button>
        </CardContent>
      </Card>
      <AdminWheelRewards />
    </div>
  );
}
