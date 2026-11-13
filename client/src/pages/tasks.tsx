import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getCountryByCode } from "@/lib/countries";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task } from "@shared/schema";
import "./partner-missions.css";

interface TaskWithStatus extends Task {
  isCompleted: boolean;
  canClaim: boolean;
  currentInvites: number;
}

export default function TasksPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const {
    data: tasks,
    isLoading,
    isError,
    refetch,
  } = useQuery<TaskWithStatus[]>({
    queryKey: ["/api/tasks"],
  });

  const claimMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/claim`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "La récompense n’est pas disponible.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refreshUser();
      toast({
        title: "Récompense réclamée",
        description: "Le montant a été ajouté à votre solde.",
      });
    },
    onError: (error: Error) =>
      toast({
        title: "Récompense indisponible",
        description: error.message,
        variant: "destructive",
      }),
  });

  if (!user) return null;

  const taskList = tasks ?? [];
  const currency = getCountryByCode(user.country)?.currency || "XOF";
  const formatAmount = (amount: number) =>
    `${Number(amount).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

  return (
    <main className="partner-missions-page" data-testid="page-partner-missions">
      <header className="partner-missions-header">
        <Link
          href="/my-page/account"
          className="partner-missions-back"
          aria-label="Retour à Moi"
          data-testid="button-back"
        >
          <ArrowLeft aria-hidden="true" />
          <span>Retour</span>
        </Link>
        <h1>Mission partenaires</h1>
        <span className="partner-missions-header-spacer" aria-hidden="true" />
      </header>

      <section className="partner-missions-list" aria-label="Missions de parrainage">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div className="partner-mission-card partner-mission-card--loading" key={index}>
              <div className="partner-mission-copy">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="mt-2 h-3 w-36" />
              </div>
              <div className="partner-mission-progress">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-7 w-24 rounded-full" />
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="partner-missions-state" role="alert">
            <p className="partner-missions-state-title">Impossible de charger les missions.</p>
            <p>Vérifiez votre connexion puis réessayez.</p>
            <button type="button" onClick={() => void refetch()} className="partner-missions-retry">
              <RefreshCw aria-hidden="true" />
              Réessayer
            </button>
          </div>
        ) : taskList.length ? (
          taskList.map((task) => {
            const isClaimable = task.canClaim && !task.isCompleted;
            const status = task.isCompleted
              ? "Récompense reçue"
              : isClaimable
                ? "À réclamer"
                : "Non terminée";

            return (
              <article
                className="partner-mission-card"
                key={task.id}
                data-testid={`task-item-${task.id}`}
              >
                <div className="partner-mission-copy">
                  <h2>{task.name}</h2>
                  <p className="partner-mission-description">{task.description}</p>
                  <p className="partner-mission-reward">Récompense de mission {formatAmount(task.reward)}</p>
                </div>

                <div className="partner-mission-progress">
                  {isClaimable ? (
                    <button
                      type="button"
                      className="partner-mission-claim"
                      onClick={() => claimMutation.mutate(task.id)}
                      disabled={claimMutation.isPending}
                      data-testid={`button-claim-${task.id}`}
                    >
                      {claimMutation.isPending ? (
                        <Loader2 className="animate-spin" aria-label="Réclamation en cours" />
                      ) : (
                        status
                      )}
                    </button>
                  ) : (
                    <span className={`partner-mission-status ${task.isCompleted ? "is-complete" : ""}`}>
                      {task.isCompleted && <Check aria-hidden="true" />}
                      {status}
                    </span>
                  )}
                  <span
                    className="partner-mission-count"
                    aria-label={`${task.currentInvites} sur ${task.requiredInvites} filleuls qualifiés`}
                  >
                    {task.currentInvites} / {task.requiredInvites}
                  </span>
                </div>
              </article>
            );
          })
        ) : (
          <div className="partner-missions-state">
            <p className="partner-missions-state-title">Aucune mission disponible</p>
            <p>Les missions actives apparaîtront ici.</p>
          </div>
        )}
      </section>
    </main>
  );
}
