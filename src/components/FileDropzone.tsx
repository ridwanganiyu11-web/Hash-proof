import React, { useRef, useState } from "react";
import { Upload, FileText, X, ShieldCheck } from "lucide-react";
import { formatFileSize } from "../utils/hash";

interface FileDropzoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onClearFile: () => void;
  isProcessing?: boolean;
  label?: string;
  sublabel?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  selectedFile,
  onFileSelect,
  onClearFile,
  isProcessing = false,
  label = "Drag and drop a file here, or click to browse",
  sublabel = "Hashed 100% locally in your browser using SHA-256. Your file never leaves your device.",
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isProcessing) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && inputRef.current?.click()}
          className={`group cursor-pointer rounded-2xl border-2 border-dashed p-8 md:p-10 text-center transition-all ${
            isDragging
              ? "border-brand-400 bg-brand-500/10"
              : "border-slate-700/80 bg-navy-900/60 hover:border-brand-500/60 hover:bg-navy-800/60"
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 group-hover:scale-105 transition-transform">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-base font-semibold text-slate-100">{label}</p>
          <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto">{sublabel}</p>
          <div className="mt-5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              Browse Local Files
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-700/80 bg-navy-900/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Local Browser Memory Only
                  </span>
                </div>
              </div>
            </div>

            {!isProcessing && (
              <button
                type="button"
                onClick={onClearFile}
                className="shrink-0 rounded-lg border border-slate-700 bg-navy-800 hover:bg-slate-800 p-2 text-slate-400 hover:text-white transition-colors"
                title="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

