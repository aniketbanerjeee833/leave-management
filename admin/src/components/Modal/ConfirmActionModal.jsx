import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export default function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  isLoading,
  title,
  description,
  confirmLabel    = "Confirm",
  cancelLabel     = "Cancel",
  confirmClassName = "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer",
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription aria-describedby={undefined} />
        </DialogHeader>

        <p className="text-sm text-gray-600 mt-1">
          {description}
        </p>

        <div className="flex justify-end gap-2 mt-4">
          <Button className="cursor-pointer"
          variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
          
            onClick={onConfirm}
            disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}