import { useLocation } from "wouter";
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
      <img
        className="floating-wheel-icon"
        src="/wheel-button-3d.png"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </button>
  );
}
