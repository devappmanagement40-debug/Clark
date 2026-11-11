import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InsertTask, Task } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Loader2, Plus, Trash2, Users } from "lucide-react";

type TaskFormState = {
  name: string;
  description: string;
  requiredInvites: string;
  reward: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm = (sortOrder: number): TaskFormState => ({
  name: "",
  description: "",
  requiredInvites: "",
  reward: "",
  sortOrder: String(sortOrder),
  isActive: true,
});

export default function AdminTasks() {
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(() => emptyForm(0));

  const { data: tasks, isLoading, isError } = useQuery<Task[]>({
    queryKey: ["/api/admin/tasks"],
  });

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      const response = await apiRequest("POST", "/api/admin/tasks", data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La création du palier a échoué.");
      }
      return response.json();
    },
    onSuccess: () => {
      invalidateTasks();
      setEditorOpen(false);
      toast({ title: "Palier ajouté" });
    },
    onError: (error: Error) => {
      toast({ title: "Ajout impossible", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTask> }) => {
      const response = await apiRequest("PATCH", `/api/admin/tasks/${id}`, data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La modification du palier a échoué.");
      }
      return response.json();
    },
    onSuccess: () => {
      invalidateTasks();
      setEditorOpen(false);
      setEditingTask(null);
      toast({ title: "Palier modifié" });
    },
    onError: (error: Error) => {
      toast({ title: "Modification impossible", description: error.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/tasks/${id}`, { isActive });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La visibilité du palier n’a pas pu être modifiée.");
      }
      return response.json();
    },
    onSuccess: invalidateTasks,
    onError: (error: Error) => {
      toast({ title: "Modification impossible", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/tasks/${id}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La suppression du palier a échoué.");
      }
      return response.json();
    },
    onSuccess: () => {
      invalidateTasks();
      toast({ title: "Palier supprimé" });
    },
    onError: (error: Error) => {
      toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
    },
  });

  const nextSortOrder = (tasks ?? []).reduce(
    (highest, task) => Math.max(highest, task.sortOrder),
    0,
  ) + 1;
  const activeCount = (tasks ?? []).filter((task) => task.isActive).length;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setEditingTask(null);
    setForm(emptyForm(nextSortOrder));
    setEditorOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      name: task.name,
      description: task.description,
      requiredInvites: String(task.requiredInvites),
      reward: String(task.reward),
      sortOrder: String(task.sortOrder),
      isActive: task.isActive,
    });
    setEditorOpen(true);
  };

  const saveTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const requiredInvites = Number(form.requiredInvites);
    const reward = Number(form.reward);
    const sortOrder = Number(form.sortOrder);
    if (
      form.name.trim().length < 2 ||
      !form.description.trim() ||
      !Number.isSafeInteger(requiredInvites) ||
      requiredInvites < 1 ||
      !Number.isSafeInteger(reward) ||
      reward < 0 ||
      !Number.isSafeInteger(sortOrder) ||
      sortOrder < 0
    ) {
      toast({
        title: "Vérifiez les champs",
        description: "Le nom, la description, les invitations, la récompense et l’ordre doivent être valides.",
        variant: "destructive",
      });
      return;
    }

    const data: InsertTask = {
      name: form.name.trim(),
      description: form.description.trim(),
      requiredInvites,
      reward,
      sortOrder,
      isActive: form.isActive,
    };

    if (editingTask) updateMutation.mutate({ id: editingTask.id, data });
    else createMutation.mutate(data);
  };

  return (
    <section className="space-y-4" data-testid="admin-task-management">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Paliers de récompense</h2>
          <p className="text-sm text-muted-foreground">
            {tasks?.length ?? 0} palier(s), dont {activeCount} actif(s)
          </p>
        </div>
        <Button onClick={openCreate} disabled={isLoading} data-testid="button-add-task">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un palier
        </Button>
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        Les récompenses déjà créditées restent dans l’historique. Un palier déjà réclamé ne peut pas être supprimé; désactivez-le plutôt.
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-28 w-full" />)}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-5 text-sm text-destructive">
            Impossible de charger les paliers. Vérifiez votre connexion administrateur puis réessayez.
          </CardContent>
        </Card>
      ) : tasks && tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="border-[#171717] shadow-sm">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{task.name}</h3>
                    <Badge variant={task.isActive ? "default" : "outline"}>
                      {task.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    <Badge variant="secondary">Ordre {task.sortOrder}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-[#1947b8]" />
                      {task.requiredInvites.toLocaleString("fr-FR")} invitations
                    </span>
                    <span className="font-semibold text-[#1947b8]">
                      {task.reward.toLocaleString("fr-FR")} XOF
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t pt-3 sm:justify-end sm:border-0 sm:pt-0">
                  <Switch
                    checked={task.isActive}
                    onCheckedChange={(isActive) => toggleMutation.mutate({ id: task.id, isActive })}
                    disabled={toggleMutation.isPending}
                    aria-label={task.isActive ? `Désactiver ${task.name}` : `Activer ${task.name}`}
                    data-testid={`switch-task-${task.id}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(task)}
                    data-testid={`button-edit-task-${task.id}`}
                  >
                    <Edit className="mr-1.5 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      if (window.confirm(`Supprimer le palier « ${task.name} » ?`)) {
                        deleteMutation.mutate(task.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    aria-label={`Supprimer ${task.name}`}
                    data-testid={`button-delete-task-${task.id}`}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Aucun palier n’est configuré. Ajoutez-en un pour l’afficher dans le Centre des tâches.
          </CardContent>
        </Card>
      )}

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setEditorOpen(false);
            setEditingTask(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? `Modifier — ${editingTask.name}` : "Nouveau palier"}</DialogTitle>
          </DialogHeader>

          {editingTask && (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              Une modification de récompense ne change pas les montants déjà crédités aux membres.
            </p>
          )}

          <form onSubmit={saveTask} className="space-y-4">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Nom du palier</span>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                maxLength={80}
                required
                data-testid="input-task-name"
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium">
              <span>Description / condition</span>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                maxLength={300}
                rows={3}
                required
                data-testid="input-task-description"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 text-sm font-medium">
                <span>Invitations requises</span>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={form.requiredInvites}
                  onChange={(event) => setForm((current) => ({ ...current, requiredInvites: event.target.value }))}
                  required
                  data-testid="input-task-required-invites"
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                <span>Récompense (XOF)</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.reward}
                  onChange={(event) => setForm((current) => ({ ...current, reward: event.target.value }))}
                  required
                  data-testid="input-task-reward"
                />
              </label>
            </div>

            <label className="block space-y-1.5 text-sm font-medium">
              <span>Ordre d’affichage</span>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.sortOrder}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                required
                data-testid="input-task-sort-order"
              />
            </label>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Afficher dans le Centre des tâches</p>
                <p className="text-xs text-muted-foreground">Un palier inactif reste modifiable ici.</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(isActive) => setForm((current) => ({ ...current, isActive }))}
                aria-label="Afficher ce palier aux utilisateurs"
                data-testid="switch-task-active"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSaving} data-testid="button-save-task">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingTask ? "Enregistrer les modifications" : "Créer le palier"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
