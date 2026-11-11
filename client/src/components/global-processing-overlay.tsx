import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { PROCESSING_END_EVENT, PROCESSING_START_EVENT } from "@/lib/queryClient";

export function ProcessingOverlay({
  variant = "blocking",
}: {
  variant?: "blocking" | "refresh";
} = {}) {
  useEffect(() => {
    if (typeof document === "undefined" || variant !== "blocking") return;
    document.body.classList.add("site-processing-active");
    return () => document.body.classList.remove("site-processing-active");
  }, [variant]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <style>{`
        @keyframes site-processing-spin {
          to { transform: rotate(360deg); }
        }
        .site-processing-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(0, 0, 0, .8);
        }
        .site-processing-backdrop--refresh {
          inset: 0;
          padding: 0;
          background: transparent;
          pointer-events: none;
        }
        .site-processing-card {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: transparent;
        }
        .site-processing-backdrop--refresh .site-processing-card {
          width: 34px;
          height: 34px;
        }
        .site-processing-spinner {
          position: relative;
          width: 34px;
          height: 34px;
          animation: site-processing-spin .9s linear infinite;
        }
        .site-processing-spinner > span {
          position: absolute;
          top: 1px;
          left: calc(50% - 2.5px);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #fff;
          transform-origin: 2.5px 16px;
        }
        .site-processing-backdrop--refresh .site-processing-spinner > span {
          background: #0b3679;
        }
        body.site-processing-active .animate-spin:not(.site-processing-spinner) {
          visibility: hidden !important;
        }
        body.site-processing-active .cp-password-loading svg {
          visibility: hidden !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .site-processing-spinner { animation-duration: 2s; }
        }
      `}</style>
      <div
        className={`site-processing-backdrop site-processing-backdrop--${variant}`}
        role="status"
        aria-label={variant === "refresh" ? "Actualisation en cours" : "Chargement en cours"}
        aria-live="polite"
        aria-atomic="true"
        aria-busy="true"
      >
        <div className="site-processing-card">
          <div className="site-processing-spinner" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <span
                key={index}
                style={{
                  transform: `rotate(${index * 30}deg)`,
                  opacity: 1 - index / 16,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

export default function GlobalProcessingOverlay() {
  const pendingQueries = useIsFetching();
  const pendingMutations = useIsMutating();
  const [pendingApiRequests, setPendingApiRequests] = useState(0);
  const actionInProgress = pendingMutations > 0 || pendingApiRequests > 0;

  useEffect(() => {
    const handleStart = () => setPendingApiRequests((count) => count + 1);
    const handleEnd = () => setPendingApiRequests((count) => Math.max(0, count - 1));

    window.addEventListener(PROCESSING_START_EVENT, handleStart);
    window.addEventListener(PROCESSING_END_EVENT, handleEnd);
    return () => {
      window.removeEventListener(PROCESSING_START_EVENT, handleStart);
      window.removeEventListener(PROCESSING_END_EVENT, handleEnd);
    };
  }, []);

  if (
    pendingQueries === 0 &&
    !actionInProgress
  ) {
    return null;
  }

  return <ProcessingOverlay variant={actionInProgress ? "blocking" : "refresh"} />;
}
