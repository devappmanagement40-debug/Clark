import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type PendingWheelReward = {
  id: number;
  userId: number;
  fullName: string;
  prizeName: string;
  prizeValue: string;
  createdAt: string;
};

function formatRewardDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function AdminWheelRewards() {
  const { toast } = useToast();
  const rewardsQuery = useQuery<PendingWheelReward[]>({
    queryKey: ["/api/admin/wheel/rewards"],
  });
  const deliverMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await apiRequest("POST", `/api/admin/wheel/rewards/${rewardId}/delivered`, {});
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/wheel/rewards"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/wheel/rewards/history"] });
      toast({ title: "Remise confirmée" });
    },
    onError: (error: Error) => toast({
      title: "Confirmation impossible",
      description: error.message,
      variant: "destructive",
    }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lots matériels à remettre</CardTitle>
        <p className="text-sm text-muted-foreground">
          Les gains en espèces sont crédités automatiquement. Confirmez ici la remise effective des lots matériels.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rewardsQuery.isLoading ? (
          <div className="flex justify-center py-5" role="status" aria-label="Chargement des lots à remettre">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rewardsQuery.isError ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-destructive">Impossible de charger les lots à remettre.</p>
            <Button type="button" variant="outline" onClick={() => void rewardsQuery.refetch()}>Réessayer</Button>
          </div>
        ) : rewardsQuery.data?.length ? (
          rewardsQuery.data.map((reward) => (
            <div key={reward.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="font-semibold">{reward.prizeName}</p>
                <p className="text-sm text-muted-foreground">
                  {reward.fullName} · ID {reward.userId} · {formatRewardDate(reward.createdAt)}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => deliverMutation.mutate(reward.id)}
                disabled={deliverMutation.isPending}
                data-testid={`button-wheel-reward-delivered-${reward.id}`}
              >
                {deliverMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Confirmer la remise
              </Button>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">Aucun lot matériel en attente.</p>
        )}
      </CardContent>
    </Card>
  );
}
