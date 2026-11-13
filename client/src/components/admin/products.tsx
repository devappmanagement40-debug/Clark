import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { catlVipOffers } from "@shared/catl-vip-offers";
import { Edit, ImagePlus, Loader2, TrendingUp, Plus, Trash2, X } from "lucide-react";
import type { Product } from "@shared/schema";

const MAX_PRODUCT_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_PRODUCT_IMAGE_DATA_URL_LENGTH = 1_400_000;

async function compressProductImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choisissez une image JPG, PNG ou WebP.");
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("L’image ne doit pas dépasser 12 Mo.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Cette image ne peut pas être lue."));
      element.src = objectUrl;
    });
    const scale = Math.min(1, 1200 / image.naturalWidth, 1200 / image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Impossible de préparer cette image.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.84, 0.72, 0.6]) {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error("Impossible de compresser cette image.")),
          "image/jpeg",
          quality,
        );
      });
      if (blob.size * 1.38 > MAX_PRODUCT_IMAGE_DATA_URL_LENGTH) continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Impossible de lire l’image préparée."));
        reader.onerror = () => reject(new Error("Impossible de lire l’image préparée."));
        reader.readAsDataURL(blob);
      });
      if (dataUrl.length <= MAX_PRODUCT_IMAGE_DATA_URL_LENGTH) return dataUrl;
    }
    throw new Error("L’image reste trop volumineuse après compression. Choisissez une image plus légère.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const productSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  price: z.string().regex(/^\d+$/, "Entrez un prix entier"),
  dailyEarnings: z.string().regex(/^\d+$/, "Entrez un montant entier"),
  cycleDays: z.string().regex(/^[1-9]\d*$/, "La durée doit être supérieure à zéro"),
  purchaseLimitPerUser: z.string().regex(/^(?:[1-9]\d*)?$/, "Entrez une limite positive ou laissez vide"),
  imageUrl: z.string().max(MAX_PRODUCT_IMAGE_DATA_URL_LENGTH, "L’image est trop volumineuse.").optional(),
  sortOrder: z.string().regex(/^\d+$/, "Entrez un ordre entier"),
  isFree: z.boolean(),
  isActive: z.boolean(),
}).superRefine((data, ctx) => {
  const price = Number(data.price);
  if (data.isFree ? price !== 0 : price <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: data.isFree ? "Un produit gratuit doit avoir un prix de 0 F" : "Le prix doit être supérieur à 0 F",
    });
  }
  if (data.isFree && data.purchaseLimitPerUser) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["purchaseLimitPerUser"],
      message: "Les produits gratuits n'ont pas de limite d'achat.",
    });
  }
});

type ProductForm = z.infer<typeof productSchema>;

export default function AdminProducts() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [uploadingImageFor, setUploadingImageFor] = useState<"create" | "edit" | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products/all"],
  });
  const sortedProducts = [...(products || [])].sort((a, b) =>
    Number(b.isActive) - Number(a.isActive) || a.sortOrder - b.sortOrder,
  );

  const editForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "", dailyEarnings: "", cycleDays: "", purchaseLimitPerUser: "", imageUrl: "", sortOrder: "0", isFree: false, isActive: true },
  });

  const createForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "", dailyEarnings: "", cycleDays: "", purchaseLimitPerUser: "", imageUrl: "", sortOrder: "0", isFree: false, isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const response = await apiRequest("POST", "/api/admin/products", data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La création du produit a échoué");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit créé!" });
      setShowCreateForm(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Création du produit impossible", description: error.message, variant: "destructive" });
    },
  });

  const initialOffersMutation = useMutation({
    mutationFn: async () => {
      if (!products) throw new Error("Le catalogue n’est pas encore chargé.");

      const existingNames = new Set(products.map(product => product.name.trim().toLocaleLowerCase("fr")));
      const productsToCreate = catlVipOffers.filter(
        product => !existingNames.has(product.name.toLocaleLowerCase("fr")),
      );
      if (productsToCreate.length === 0) {
        return { created: 0, alreadyPresent: catlVipOffers.length };
      }

      for (let index = 0; index < productsToCreate.length; index += 1) {
        const product = productsToCreate[index];
        const response = await apiRequest("POST", "/api/admin/products", {
          ...product,
          sortOrder: catlVipOffers.findIndex(vipOffer => vipOffer.name === product.name),
          isFree: false,
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message || `La création de « ${product.name} » a échoué.`);
        }
      }

      return {
        created: productsToCreate.length,
        alreadyPresent: catlVipOffers.length - productsToCreate.length,
      };
    },
    onSuccess: ({ created, alreadyPresent }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: created ? `${created} plan(s) VIP ajouté(s)` : "Les neuf plans VIP sont déjà présents",
        description: created
          ? `${alreadyPresent} déjà présent(s). Les nouveaux plans sont actifs; les fiches existantes sont conservées.`
          : "Aucune nouvelle fiche n’a été créée.",
      });
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Ajout des offres interrompu",
        description: `${error.message} Recharge la page avant de réessayer pour éviter les doublons.`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${id}`, data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La mise à jour du produit a échoué");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit mis à jour!" });
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Mise à jour du produit impossible", description: error.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${id}`, { isActive });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La modification de la visibilité du produit a échoué");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({ title: "Modification de la visibilité impossible", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/products/${id}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La suppression du produit a échoué");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit supprimé" });
    },
    onError: (error: any) => {
      toast({ title: "Suppression du produit impossible", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    editForm.reset({
      name: product.name,
      price: product.price.toString(),
      dailyEarnings: product.dailyEarnings.toString(),
      cycleDays: product.cycleDays.toString(),
      purchaseLimitPerUser: product.purchaseLimitPerUser?.toString() || "",
      imageUrl: product.imageUrl || "",
      sortOrder: product.sortOrder.toString(),
      isFree: product.isFree,
      isActive: product.isActive,
    });
  };

  const handleUpdate = (data: ProductForm) => {
    if (!selectedProduct) return;
    const price = parseInt(data.price);
    const dailyEarnings = parseInt(data.dailyEarnings);
    const cycleDays = parseInt(data.cycleDays);
    updateMutation.mutate({
      id: selectedProduct.id,
      data: {
        name: data.name,
        price,
        dailyEarnings,
        cycleDays,
        totalReturn: dailyEarnings * cycleDays,
        purchaseLimitPerUser: data.purchaseLimitPerUser ? Number(data.purchaseLimitPerUser) : null,
        imageUrl: data.imageUrl || null,
        sortOrder: parseInt(data.sortOrder),
        isFree: data.isFree,
        isActive: data.isActive,
      },
    });
  };

  const handleCreate = (data: ProductForm) => {
    createMutation.mutate(data);
  };

  const ProductFormFields = ({
    form,
    formKey,
    isPending,
    submitLabel,
  }: {
    form: any;
    formKey: "create" | "edit";
    isPending: boolean;
    submitLabel: string;
  }) => (
    <form onSubmit={form.handleSubmit(submitLabel === "Créer" ? handleCreate : handleUpdate)} className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Nom du produit</FormLabel>
          <FormControl><Input {...field} placeholder="Ex: Cellule Essentielle" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="price" render={({ field }) => (
          <FormItem>
            <FormLabel>Prix (F)</FormLabel>
          <FormControl><Input {...field} type="number" min="0" step="1" placeholder="Ex: 15000" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="dailyEarnings" render={({ field }) => (
          <FormItem>
            <FormLabel>Gains/jour (F)</FormLabel>
          <FormControl><Input {...field} type="number" min="0" step="1" placeholder="Ex: 300" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <FormField control={form.control} name="cycleDays" render={({ field }) => (
        <FormItem>
          <FormLabel>Durée (jours)</FormLabel>
          <FormControl><Input {...field} type="number" min="1" step="1" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="purchaseLimitPerUser" render={({ field }) => (
        <FormItem>
          <FormLabel>Achats maximum par compte <span className="text-muted-foreground font-normal">(facultatif)</span></FormLabel>
          <FormControl><Input {...field} type="number" min="1" step="1" placeholder="Vide = sans limite" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="sortOrder" render={({ field }) => (
          <FormItem>
            <FormLabel>Ordre d’affichage</FormLabel>
            <FormControl><Input {...field} type="number" min="0" step="1" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="isFree" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-3">
            <FormLabel>Produit gratuit</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  const currentPrice = form.getValues("price");
                  if (checked) form.setValue("price", "0", { shouldValidate: true });
                  else if (currentPrice === "0") form.setValue("price", "", { shouldValidate: true });
                  if (checked) form.setValue("purchaseLimitPerUser", "", { shouldValidate: true });
                }}
              />
            </FormControl>
          </FormItem>
        )} />
      </div>
      <FormField control={form.control} name="isActive" render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-3">
          <FormLabel>Visible dans le catalogue</FormLabel>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="imageUrl" render={({ field }) => (
        <FormItem>
          <FormLabel>Image du produit <span className="text-muted-foreground font-normal">(facultative)</span></FormLabel>
          <FormControl>
            <div className="space-y-3">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingImageFor === formKey}
                onChange={async (event) => {
                  const input = event.currentTarget;
                  const file = input.files?.[0];
                  if (!file) return;
                  setUploadingImageFor(formKey);
                  try {
                    field.onChange(await compressProductImage(file));
                    toast({ title: "Image prête", description: "Elle sera enregistrée avec le produit." });
                  } catch (error) {
                    toast({
                      title: "Importation de l’image impossible",
                      description: error instanceof Error ? error.message : "Réessayez avec une autre image.",
                      variant: "destructive",
                    });
                  } finally {
                    setUploadingImageFor(null);
                    input.value = "";
                  }
                }}
              />
              {field.value && (
                <div className="flex items-center gap-3 rounded-md border p-2">
                  <img
                    src={field.value}
                    alt="Aperçu de l’image du produit"
                    className="h-16 w-20 rounded object-contain"
                  />
                  <span className="min-w-0 flex-1 text-sm text-muted-foreground">Image sélectionnée</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Retirer l’image du produit"
                    onClick={() => field.onChange("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou WebP. L’image est compressée avant son enregistrement.
              </p>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      {form.watch("price") && form.watch("dailyEarnings") && form.watch("cycleDays") && (
        <div className="bg-primary/10 rounded-lg p-3 text-sm">
          <p className="text-muted-foreground">Retour total estimé :</p>
          <p className="font-bold text-primary text-lg">
            {(parseInt(form.watch("dailyEarnings") || "0") * parseInt(form.watch("cycleDays") || "0")).toLocaleString()} F
          </p>
        </div>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={isPending || uploadingImageFor === formKey}
        data-testid="button-save-product"
      >
        {isPending || uploadingImageFor === formKey ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <><ImagePlus className="mr-2 h-4 w-4" />{submitLabel}</>
        )}
      </Button>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{products?.length || 0} produit(s)</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!products || isLoading || initialOffersMutation.isPending}
            onClick={() => {
              if (window.confirm(
                "Ajouter les 9 plans VIP manquants ? Les plans ajoutés seront actifs et les fiches existantes resteront inchangées.",
              )) {
                initialOffersMutation.mutate();
              }
            }}
            data-testid="button-add-initial-catl-vip-offers"
          >
            {initialOffersMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Ajouter les 9 plans VIP
          </Button>
          <Button onClick={() => { setShowCreateForm(true); createForm.reset(); }} data-testid="button-add-product">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Les plans VIP ajoutés ici restent modifiables dans cette section.
      </p>

      {isLoading ? (
        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
      ) : sortedProducts.length > 0 ? (
        sortedProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-contain border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{product.name}</p>
                      {product.isFree && <Badge variant="secondary" className="text-xs">Gratuit</Badge>}
                      <Badge variant={product.isActive ? "default" : "outline"} className="text-xs">
                        {product.isActive ? "Actif" : "Inactif"}
                      </Badge>
                      {!product.isFree && product.purchaseLimitPerUser !== null && (
                        <Badge variant="outline" className="text-xs">
                          Max {product.purchaseLimitPerUser} / compte
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.price.toLocaleString()} F — {product.dailyEarnings.toLocaleString()} F/jour
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={product.isActive}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: product.id, isActive: checked })}
                    aria-label={product.isActive ? `Bloquer ${product.name}` : `Débloquer ${product.name}`}
                    title={product.isActive ? "Bloquer ce produit" : "Débloquer ce produit"}
                    data-testid={`switch-product-${product.id}`}
                  />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(product)} data-testid={`button-edit-product-${product.id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!product.isFree && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => { if (confirm(`Supprimer "${product.name}" ?`)) deleteMutation.mutate(product.id); }}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-product-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Prix</p>
                  <p className="font-medium text-foreground">{product.price.toLocaleString()} F</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gains/jour</p>
                  <p className="font-medium text-foreground">{product.dailyEarnings.toLocaleString()} F</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total ({product.cycleDays}j)</p>
                  <p className="font-medium text-primary">{product.totalReturn.toLocaleString()} F</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Aucun produit
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateForm} onOpenChange={(open) => { if (!open) { setShowCreateForm(false); createForm.reset(); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau produit</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <ProductFormFields form={createForm} formKey="create" isPending={createMutation.isPending} submitLabel="Créer" />
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier — {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            Les changements de prix, de gains ou de durée peuvent aussi modifier les investissements déjà en cours.
          </p>
          <Form {...editForm}>
            <ProductFormFields form={editForm} formKey="edit" isPending={updateMutation.isPending} submitLabel="Enregistrer" />
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
