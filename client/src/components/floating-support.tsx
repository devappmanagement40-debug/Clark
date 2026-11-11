import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import treasureChest from "@assets/generated_images/gift-chest-3d-icon.png";

const POSITION_STORAGE_KEY = "floating-support-position-v1";
const BUTTON_SIZE = 64;
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
  const maxX = Math.max(8, window.innerWidth - BUTTON_SIZE - 8);
  const maxY = Math.max(8, window.innerHeight - BUTTON_SIZE - NAVIGATION_CLEARANCE);

  return {
    x: Math.min(maxX, Math.max(8, point.x)),
    y: Math.min(maxY, Math.max(8, point.y)),
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
    // Storage can be unavailable in private browsing; use the default position.
  }

  return null;
}

export default function FloatingSupport() {
  const [, navigate] = useLocation();
  const [position, setPosition] = useState<Point | null>(null);
  const positionRef = useRef<Point | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const saved = readSavedPoint();
    const initial = saved ?? clampPoint({
      x: window.innerWidth - BUTTON_SIZE - 16,
      y: Math.round(window.innerHeight * 0.72),
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

  const savePosition = (point: Point) => {
    const clamped = clampPoint(point);
    positionRef.current = clamped;
    setPosition(clamped);

    try {
      window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(clamped));
    } catch {
      // The button remains movable for this session if storage is unavailable.
    }
  };

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
    suppressClickRef.current = drag.moved;
    if (drag.moved && positionRef.current) {
      try {
        window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(positionRef.current));
      } catch {
        // Position persistence is optional.
      }
    }
  };

  if (!position) return null;

  return (
    <button
      type="button"
      aria-label="Ouvrir les codes cadeaux. Faire glisser pour déplacer le coffre."
      title="Codes cadeaux — faire glisser pour déplacer"
      data-testid="floating-gift-code"
      className="fixed z-[40] grid h-16 w-16 touch-none select-none place-items-center rounded-full border-0 bg-transparent p-0 shadow-none transition-transform hover:scale-110 active:scale-95"
      style={{ left: position.x, top: position.y, cursor: dragRef.current ? "grabbing" : "grab" }}
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
        navigate("/gift-code");
      }}
    >
      <img
        src={treasureChest}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="gift-chest-shake h-16 w-16 object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.38)]"
      />
    </button>
  );
}
