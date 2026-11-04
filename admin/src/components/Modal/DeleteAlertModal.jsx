import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DeleteAlertModal({
  open,
  onClose,
  onConfirm,
  isDeleting,
  itemName,
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="z-[200] max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
        </DialogHeader>

        <p className="mt-1 text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900">
            {itemName}
          </span>
          ? This action cannot be undone.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="cursor-pointer bg-rose-600 text-white hover:bg-rose-700"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}