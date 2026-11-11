import { useLocation } from "wouter";
import { Disc3 } from "lucide-react";
import "./floating-wheel-action.css";

export default function FloatingWheelAction() {
  const [, navigate] = useLocation();
  return (
    <button
      type="button"
      className="floating-wheel-action"
      aria-label="Ouvrir le grand tirage chanceux"
      title="Grand Tirage Chanceux"
      data-testid="floating-wheel-action"
      onClick={() => navigate("/my-page/wheel")}
    >
      <span className="floating-wheel-ring" aria-hidden="true">
        <Disc3 size={27} strokeWidth={1.8} />
      </span>
    </button>
  );
}
