import "./_group.css";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Loader2, Trophy, CheckCircle2 } from "lucide-react";

interface TaskWithStatus {
  id: number;
  name: string;
  requiredInvites: number;
  reward: number;
  isCompleted: boolean;
  canClaim: boolean;
  currentInvites: number;
}

const jollibeeImg = "/__mockup/images/task-center/old-task-hero.jpeg";
const emptyIllustration = "/__mockup/images/task-center/empty-state.png";
const iconBronze = "/__mockup/images/task-center/bronze.png";
const iconArgent = "/__mockup/images/task-center/silver.png";
const iconOr = "/__mockup/images/task-center/gold.jpg";
const iconPlatine = "/__mockup/images/task-center/platinum.png";
const iconDiamant = "/__mockup/images/task-center/diamond.png";

const TIER_LABELS = [
  "Parrain Bronze",
  "Parrain Argent",
  "Parrain Or",
  "Parrain Platine",
  "Parrain Diamant",
  "Parrain Elite",
];

const TIER_COLORS = [
  { bg: "from-amber-700 to-amber-500" },
  { bg: "from-gray-500 to-gray-400" },
  { bg: "from-yellow-600 to-yellow-400" },
  { bg: "from-cyan-600 to-cyan-400" },
  { bg: "from-orange-700 to-orange-500" },
  { bg: "from-orange-800 to-orange-600" },
];

const TIER_ICONS = [iconBronze, iconArgent, iconOr, iconPlatine, iconDiamant, iconBronze];

const tasks: TaskWithStatus[] = [
  { id: 1, name: "Parrain Bronze", requiredInvites: 3, reward: 350, currentInvites: 1, isCompleted: false, canClaim: false },
  { id: 2, name: "Parrain Argent", requiredInvites: 5, reward: 750, currentInvites: 2, isCompleted: false, canClaim: false },
  { id: 3, name: "Parrain Or", requiredInvites: 10, reward: 2500, currentInvites: 10, isCompleted: false, canClaim: true },
  { id: 4, name: "Parrain Platine", requiredInvites: 30, reward: 6500, currentInvites: 30, isCompleted: true, canClaim: false },
  { id: 5, name: "Parrain Diamant", requiredInvites: 100, reward: 15000, currentInvites: 42, isCompleted: false, canClaim: false },
  { id: 6, name: "Parrain Elite", requiredInvites: 300, reward: 50000, currentInvites: 150, isCompleted: false, canClaim: false },
];
const isLoading = false;
const currency = "XOF";
const totalTaskRewards = tasks.filter((task) => task.isCompleted).reduce((sum, task) => sum + task.reward, 0);
const completedCount = tasks.filter((task) => task.isCompleted).length;
const claimableCount = tasks.filter((task) => task.canClaim && !task.isCompleted).length;
const claimMutation = {
  isPending: false,
  mutateAsync: async (_taskId: number) => undefined,
  mutate: (_taskId: number) => undefined,
};

export default function Current() {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">

      {/* Hero Section — tall enough so bottom text clears the stats card overlap */}
      <div className="relative overflow-hidden" style={{ height: "260px" }}>
        <img
          src={jollibeeImg}
          alt="Visuel du programme de parrainage Equinor"
          className="w-full h-full object-cover object-center"
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,113,197,0.80) 0%, rgba(0,90,158,0.70) 45%, rgba(0,40,100,0.95) 100%)" }}
        />

        {/* Header nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center px-4 pt-4">
          <a
            href="/"
            className="w-9 h-9 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center"
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </a>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold">Equinor</span>
            </div>
          </div>
          <div className="w-9" />
        </div>

        {/* Hero text — positioned above the stats card overlap zone (bottom 60px) */}
        <div className="absolute left-4 right-4" style={{ bottom: "60px" }}>
          <h1 className="text-white font-bold text-xl leading-tight" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            Programme de Parrainage
          </h1>
          <p className="text-white text-xs mt-1" style={{ opacity: 0.92, textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
            Invitez des amis et gagnez des récompenses
          </p>
        </div>
      </div>

      {/* Stats Row — overlaps bottom of hero */}
      <div className="mx-4 -mt-10 z-10 relative">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between">
          <div className="flex-1 text-center border-r border-gray-100">
            <p className="text-[#FF4500] text-xl font-bold" data-testid="text-total-rewards">
              {totalTaskRewards.toLocaleString()}
            </p>
            <p className="text-gray-500 text-[11px] mt-0.5">{currency} gagnés</p>
          </div>
          <div className="flex-1 text-center border-r border-gray-100">
            <p className="text-[#FF4500] text-xl font-bold">{completedCount}</p>
            <p className="text-gray-500 text-[11px] mt-0.5">Terminées</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[#FF4500] text-xl font-bold">{claimableCount}</p>
            <p className="text-gray-500 text-[11px] mt-0.5">À réclamer</p>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="mx-4 mt-4 mb-24">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FF4500]" />
            <h2 className="text-gray-800 font-bold text-sm">Paliers de parrainage</h2>
          </div>
          {claimableCount > 0 && (
            <button
              onClick={async () => {
                const claimable = tasks?.filter(t => t.canClaim && !t.isCompleted) || [];
                for (const task of claimable) {
                  try { await claimMutation.mutateAsync(task.id); } catch {}
                }
              }}
              disabled={claimMutation.isPending}
              className="text-xs text-[#FF4500] font-semibold bg-red-50 px-3 py-1.5 rounded-full"
              data-testid="button-claim-rewards"
            >
              Tout réclamer ({claimableCount})
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task, index) => {
              const tier = TIER_COLORS[index] || TIER_COLORS[0];
              const label = TIER_LABELS[index] || `Palier ${index + 1}`;
              const icon = TIER_ICONS[index] || TIER_ICONS[0];
              const progress = Math.min((task.currentInvites / task.requiredInvites) * 100, 100);

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${
                    task.isCompleted
                      ? "border-green-200"
                      : task.canClaim
                      ? "border-[#FF4500]/40"
                      : "border-gray-100"
                  }`}
                  data-testid={`task-item-${task.id}`}
                >
                  {/* Tier Header */}
                  <div className={`bg-gradient-to-r ${tier.bg} px-4 py-2.5 flex items-center justify-between`}>
                    <span className="text-white font-bold text-sm">{label}</span>
                    {task.isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>

                  {/* Task Body */}
                  <div className="p-3 flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
                      <img src={icon} alt={label} className="w-12 h-12 object-contain" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 text-xs leading-snug mb-0.5">
                        Inviter{" "}
                        <span className="font-bold text-gray-900">{task.requiredInvites}</span>{" "}
                        personnes à recharger
                      </p>
                      <p className="text-[#FF4500] font-bold text-base">
                        {task.reward.toLocaleString()} {currency}
                      </p>

                      {/* Progress */}
                      <div className="mt-1.5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-400 text-[10px]">
                            {task.currentInvites} / {task.requiredInvites} invitations
                          </span>
                          <span className="text-gray-400 text-[10px]">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              task.isCompleted ? "bg-green-500" : "bg-[#FF4500]"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {task.isCompleted ? (
                        <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2.5 py-1.5 rounded-full block text-center">
                          ✓ Fait
                        </span>
                      ) : task.canClaim ? (
                        <button
                          onClick={() => !claimMutation.isPending && claimMutation.mutate(task.id)}
                          disabled={claimMutation.isPending}
                          className="bg-[#FF4500] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform shadow-sm"
                          data-testid={`button-claim-${task.id}`}
                        >
                          {claimMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Réclamer"
                          )}
                        </button>
                      ) : (
                        <span className="bg-gray-100 text-gray-400 text-[10px] font-semibold px-2.5 py-1.5 rounded-full block text-center">
                          En cours
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 flex flex-col items-center gap-2">
            <img src={emptyIllustration} alt="Vide" className="w-40 h-40 object-contain opacity-90" />
            <p className="text-gray-500">Aucune tâche disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}
