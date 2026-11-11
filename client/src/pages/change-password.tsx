import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import AccountDetailHeader from "@/components/account-detail-header";
import "./change-password.css";

export default function ChangePasswordPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/change-password", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Le mot de passe n'a pas pu être modifié.");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Mot de passe modifié avec succès" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/personal-information");
    },
    onError: (error: Error) => {
      toast({ title: "Modification du mot de passe impossible", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Champs requis", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Mot de passe trop court", description: "Minimum 6 caractères requis", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Confirmation du mot de passe impossible", description: "Les nouveaux mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <main className="cp-account-detail cp-change-password-page">
      <AccountDetailHeader
        title="Changer le mot de passe"
        onBack={() => navigate("/personal-information")}
        showHero
      />

      <form
        className="cp-password-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
          <div className="cp-password-group">
            <label htmlFor="current-password">Ancien mot de passe</label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Saisissez votre ancien mot de passe"
              autoComplete="current-password"
              data-testid="input-current-password"
            />
          </div>

          <div className="cp-password-group">
            <label htmlFor="new-password">Nouveau mot de passe</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Saisissez votre nouveau mot de passe"
              autoComplete="new-password"
              data-testid="input-new-password"
            />
          </div>

          <div className="cp-password-group">
            <label htmlFor="confirm-password">Confirmer le mot de passe</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Saisissez à nouveau votre nouveau mot de passe"
              autoComplete="new-password"
              data-testid="input-confirm-password"
            />
          </div>

          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="cp-password-submit"
            data-testid="button-change-password-submit"
          >
            {changePasswordMutation.isPending ? (
              <span className="cp-password-loading">
                <Loader2 aria-hidden="true" />
                Modification...
              </span>
            ) : (
              "Confirmer"
            )}
          </button>
      </form>
    </main>
  );
}
