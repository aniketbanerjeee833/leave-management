import { useRef, useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export default function EditModal({
  open,
  onClose,
  onSave,
  isSaving,
  title,
  fields,        // array of { name, label, type? }
  initialData,   // object with current values
  showImage,     // true = show image upload field
  currentImageUrl,
}) {
  const [formData, setFormData] = useState({});
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const fileInputRef = useRef(null);

  // reset form when modal opens with new data
  useEffect(() => {
    if (open && initialData) {
      setFormData(initialData);
      setFile(null);
      setPreview(null);
    }
  }, [open, initialData]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = () => {
    onSave({ formData, file });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription aria-describedby={undefined} />
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">

          {/* Dynamic fields */}
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">{field.label}</label>
              <Input
                type={field.type || "text"}
                value={formData[field.name] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                }
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                className="h-9 text-sm"
              />
            </div>
          ))}

          {/* Image upload — only when showImage=true */}
          {showImage && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Image</label>

              {/* current image */}
              {currentImageUrl && !preview && (
                <img
                  src={currentImageUrl}
                  alt="current"
                  className="w-24 h-16 object-cover rounded-lg border border-gray-200 mb-1"
                />
              )}

              {/* drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  h-36 rounded-xl border-2 border-dashed flex flex-col items-center
                  justify-center gap-2 cursor-pointer transition-colors
                  ${preview
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50"
                  }
                `}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <>
                    <Upload size={22} className="text-gray-400" />
                    <p className="text-xs text-gray-500 text-center px-4">
                      Click or drag to replace image
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {preview && (
                <button
                  className="text-xs text-rose-500 hover:underline self-start"
                  onClick={() => { setFile(null); setPreview(null); }}
                >
                  Remove new image
                </button>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}