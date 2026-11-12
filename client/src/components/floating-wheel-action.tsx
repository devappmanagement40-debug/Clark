import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import "./floating-wheel-action.css";

const POSITION_STORAGE_KEY = "floating-wheel-position-v1";
const BUTTON_SIZE = 62;
const NAVIGATION_CLEARANCE = 88;

interface Point {
  x: number;
  y: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  origin: Point;
  moved: boolean;
}

function clampPoint(point: Point): Point {
  return {
    x: Math.min(Math.max(8, window.innerWidth - BUTTON_SIZE - 8), Math.max(8, point.x)),
    y: Math.min(
      Math.max(8, window.innerHeight - BUTTON_SIZE - NAVIGATION_CLEARANCE),
      Math.max(8, point.y),
    ),
  };
}

function readSavedPoint(): Point | null {
  try {
    const saved = window.localStorage.getItem(POSITION_STORAGE_KEY);
    if (!saved) return null;
    const point: unknown = JSON.parse(saved);
    if (
      typeof point === "object" &&
      point !== null &&
      "x" in point &&
      "y" in point &&
      typeof point.x === "number" &&
      typeof point.y === "number" &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y)
    ) {
      return clampPoint({ x: point.x, y: point.y });
    }
  } catch {
    // Use the default position when storage is unavailable.
  }
  return null;
}

export default function FloatingWheelAction() {
  const [, navigate] = useLocation();
  const [position, setPosition] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const positionRef = useRef<Point | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const giftDefaultY = Math.round(window.innerHeight * 0.72);
    const initial = readSavedPoint() ?? clampPoint({
      x: window.innerWidth - BUTTON_SIZE - 16,
      y: Math.min(
        Math.round(window.innerHeight * 0.58),
        giftDefaultY - BUTTON_SIZE - 22,
      ),
    });
    positionRef.current = initial;
    setPosition(initial);

    const handleResize = () => {
      const current = positionRef.current;
      if (!current) return;
      const next = clampPoint(current);
      positionRef.current = next;
      setPosition(next);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!positionRef.current) return;

    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: positionRef.current,
      moved: false,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) > 5) drag.moved = true;
    if (!drag.moved) return;

    event.preventDefault();
    const next = clampPoint({
      x: drag.origin.x + deltaX,
      y: drag.origin.y + deltaY,
    });
    positionRef.current = next;
    setPosition(next);
  };

  const finishPointerDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);
    suppressClickRef.current = drag.moved;
    if (!drag.moved || !positionRef.current) return;

    try {
      window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(positionRef.current));
    } catch {
      // The position remains movable for this session when storage is unavailable.
    }
  };

  if (!position) return null;

  return (
    <button
      type="button"
      className="floating-wheel-action"
      aria-label="Ouvrir la roue. Faire glisser pour déplacer."
      title="Grand Tirage Chanceux — faire glisser pour déplacer"
      data-testid="floating-wheel-action"
      style={{ left: position.x, top: position.y, cursor: isDragging ? "grabbing" : "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerDrag}
      onPointerCancel={finishPointerDrag}
      onClick={(event) => {
        if (suppressClickRef.current) {
          event.preventDefault();
          suppressClickRef.current = false;
          return;
        }
        navigate("/my-page/wheel");
      }}
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
