import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Gift,
  Loader2,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getCountryByCode } from "@/lib/countries";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task } from "@shared/schema";
import giftCrimson from "@assets/generated_images/task-gift-crimson.png";
import giftWhiteRed from "@assets/generated_images/task-gift-white-red.png";
import giftGold from "@assets/generated_images/task-gift-gold.png";
import giftRuby from "@assets/generated_images/task-gift-ruby.png";
import giftPair from "@assets/generated_images/task-gift-pair.png";

interface TaskWithStatus extends Task {
  isCompleted: boolean;
  canClaim: boolean;
  currentInvites: number;
}

const giftArtworks = [giftCrimson, giftWhiteRed, giftGold, giftRuby, giftPair];

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
        throw new Error(data.message || "Récompense indisponible");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refreshUser();
      toast({
        title: "Récompense réclamée",
        description: "Le bonus a été ajouté à votre compte.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Récompense indisponible",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const taskList = tasks ?? [];
  const currency = getCountryByCode(user.country)?.currency || "FCFA";
  const totalTaskRewards = taskList
    .filter((task) => task.isCompleted)
    .reduce((sum, task) => sum + task.reward, 0);
  const completedCount = taskList.filter((task) => task.isCompleted).length;
  const claimableTasks = taskList.filter((task) => task.canClaim && !task.isCompleted);
  const claimableCount = claimableTasks.length;

  const claimAll = async () => {
    for (const task of claimableTasks) {
      try {
        await claimMutation.mutateAsync(task.id);
      } catch {
        // The mutation displays its own error and continues with the next eligible task.
      }
    }
  };

  return (
    <main className="min-h-full bg-white pb-24 text-[#151515]" data-testid="page-task-center">
      <header className="border-b-2 border-black bg-[#1947b8] text-white">
        <div className="mx-auto flex min-h-[68px] w-full max-w-xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            aria-label="Retour à l’accueil"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/10 transition-colors hover:bg-white/20"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
              Centre des tâches
            </p>
            <h1 className="truncate text-lg font-extrabold leading-tight">
              Récompenses des tâches
            </h1>
          </div>
          <Gift className="h-6 w-6 shrink-0" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-xl px-4">
        <section
          aria-label="Résumé des récompenses"
          className="relative z-10 -mt-1 grid grid-cols-3 overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[3px_4px_0_#151515]"
        >
          <div className="min-w-0 border-r border-black/15 px-2 py-3 text-center">
            <p className="truncate text-base font-extrabold leading-tight sm:text-lg" data-testid="text-total-rewards">
              {totalTaskRewards.toLocaleString("fr-FR")}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-gray-600">{currency} réclamés</p>
          </div>
          <div className="min-w-0 border-r border-black/15 px-2 py-3 text-center">
            <p className="text-base font-extrabold leading-tight sm:text-lg">{completedCount}</p>
            <p className="mt-1 text-[10px] font-semibold text-gray-600">Terminées</p>
          </div>
          <div className="min-w-0 px-2 py-3 text-center">
            <p className="text-base font-extrabold leading-tight text-[#1947b8] sm:text-lg">
              {claimableCount}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-gray-600">À réclamer</p>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Trophy className="h-5 w-5 shrink-0 text-[#1947b8]" aria-hidden="true" />
              <h2 className="truncate text-base font-extrabold">Paliers de parrainage</h2>
            </div>
            {claimableCount > 0 && (
              <button
                type="button"
                onClick={claimAll}
                disabled={claimMutation.isPending}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border-2 border-black bg-[#1947b8] px-3 py-2 text-xs font-bold text-white shadow-[2px_2px_0_#151515] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="button-claim-rewards"
              >
                Tout réclamer <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span>({claimableCount})</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4" aria-label="Chargement des tâches">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex gap-3 rounded-2xl border-2 border-black bg-white p-3 shadow-[2px_3px_0_#151515]"
                >
                  <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl border-2 border-black bg-white px-5 py-7 text-center shadow-[2px_3px_0_#151515]">
              <p className="font-bold">Impossible de charger les tâches.</p>
              <p className="mt-1 text-sm text-gray-600">Vérifiez votre connexion puis réessayez.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[#1947b8] px-4 py-2 text-sm font-bold text-white"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Réessayer
              </button>
            </div>
          ) : taskList.length > 0 ? (
            <div className="space-y-4">
              {taskList.map((task, index) => {
                const progress =
                  task.requiredInvites > 0
                    ? Math.max(
                        0,
                        Math.min((task.currentInvites / task.requiredInvites) * 100, 100),
                      )
                    : 100;
                const isClaimable = task.canClaim && !task.isCompleted;
                const statusLabel = task.isCompleted
                  ? "Réclamée"
                  : isClaimable
                    ? "À réclamer"
                    : "À compléter";
                const requirement =
                  task.description?.trim() ||
                  `Avoir ${task.requiredInvites} filleuls ayant acheté un produit payant`;
                const giftImage = giftArtworks[index % giftArtworks.length];

                return (
                  <article
                    key={task.id}
                    className="overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[2px_3px_0_#151515]"
                    data-testid={`task-item-${task.id}`}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-black/15 px-3 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-extrabold ${
                          task.isCompleted
                            ? "border-gray-300 bg-gray-100 text-gray-800"
                            : isClaimable
                              ? "border-[#1947b8] bg-[#1947b8] text-white"
                              : "border-[#1947b8] bg-white text-[#1947b8]"
                        }`}
                      >
                        {task.isCompleted && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                        {statusLabel}
                      </span>
                      <span className="min-w-0 truncate text-right text-xs font-extrabold">
                        {task.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3 p-3 sm:grid-cols-[84px_minmax(0,1fr)]">
                      <div className="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-xl border border-[#1947b8]/25 bg-[#edf2ff] sm:h-[84px] sm:w-[84px]">
                        <img
                          src={giftImage}
                          alt=""
                          aria-hidden="true"
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] leading-snug text-gray-700">
                          <span className="font-extrabold text-[#151515]">Requis : </span>
                          {requirement}
                        </p>
                        <p className="mt-1 text-lg font-extrabold leading-tight text-[#1947b8]">
                          {task.reward.toLocaleString("fr-FR")}{" "}
                          <span className="text-[11px] font-bold text-[#151515]">{currency}</span>
                        </p>
                        <p className="mt-1 text-[10px] leading-snug text-gray-600">
                          Un filleul compte après l’achat d’un produit payant. Une inscription ou un dépôt seul ne suffit pas.
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-semibold text-gray-600">
                          <span>Progression</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div
                          className="mt-1 h-2 overflow-hidden rounded-full border border-black/10 bg-gray-100"
                          role="progressbar"
                          aria-label={`Progression ${task.name}`}
                          aria-valuenow={task.currentInvites}
                          aria-valuemin={0}
                          aria-valuemax={task.requiredInvites}
                        >
                          <div
                            className={`h-full rounded-full transition-[width] duration-500 ${
                              task.isCompleted ? "bg-emerald-600" : "bg-[#1947b8]"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-gray-700">
                            {task.currentInvites} / {task.requiredInvites} filleuls avec achat
                          </span>
                          {task.isCompleted ? (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-black px-2.5 py-1 text-[10px] font-bold text-gray-700"
                              aria-label="Palier réclamé"
                            >
                              <Check className="h-3 w-3" aria-hidden="true" /> Fait
                            </span>
                          ) : isClaimable ? (
                            <button
                              type="button"
                              onClick={() => claimMutation.mutate(task.id)}
                              disabled={claimMutation.isPending}
                              className="inline-flex min-w-[82px] shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#1947b8] px-3 py-1.5 text-[10px] font-extrabold text-white shadow-[2px_2px_0_#151515] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                              data-testid={`button-claim-${task.id}`}
                            >
                              {claimMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="Réclamation en cours" />
                              ) : (
                                "Réclamer"
                              )}
                            </button>
                          ) : (
                            <span className="shrink-0 text-[10px] font-semibold text-gray-500">
                              En cours
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-black bg-white px-5 py-8 text-center shadow-[2px_3px_0_#151515]">
              <img
                src={giftPair}
                alt=""
                aria-hidden="true"
                className="mx-auto h-24 w-24 object-contain"
              />
              <p className="mt-2 font-extrabold">Aucune tâche disponible</p>
              <p className="mt-1 text-sm text-gray-600">
                Les nouveaux paliers apparaîtront ici dès qu’ils seront activés.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
