import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const errorToast = toasts.find((toast) => toast.variant === "destructive")

  return (
    <ToastProvider>
      {toasts.filter((toast) => toast.variant !== "destructive").map(function ({ id, title, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} duration={2000} {...props}>
            {title && <ToastTitle>{title}</ToastTitle>}
          </Toast>
        )
      })}
      <ToastViewport />
      <Dialog
        open={Boolean(errorToast?.open)}
        onOpenChange={(open) => {
          if (!open && errorToast) dismiss(errorToast.id)
        }}
      >
        <DialogContent
          className="site-error-dialog"
          overlayClassName="site-error-overlay"
          aria-describedby="site-error-description"
        >
          <div className="site-error-header">
            <AlertCircle size={17} aria-hidden="true" />
            <DialogTitle>{errorToast?.title ?? "Une erreur est survenue"}</DialogTitle>
          </div>
          <DialogDescription id="site-error-description" className="site-error-description">
            {errorToast?.description ?? "L’opération n’a pas pu aboutir. Vérifiez les informations puis réessayez."}
          </DialogDescription>
          <div className="site-error-footer">
            <button
              type="button"
              className="site-error-confirm"
              onClick={() => errorToast && dismiss(errorToast.id)}
              autoFocus
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </ToastProvider>
  )
}
