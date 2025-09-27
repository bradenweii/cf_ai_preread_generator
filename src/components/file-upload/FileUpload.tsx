import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Paperclip, X, FileText } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { MarkdownPreview } from "@/components/markdown-preview/MarkdownPreview";

export interface FileUploadProps {
  onFileSelect: (file: File, content?: string) => void;
  onFileRemove: (fileId: string) => void;
  uploadedFiles: UploadedFile[];
  disabled?: boolean;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
}

export interface UploadedFile {
  id: string;
  file: File;
  content?: string;
  error?: string;
  isProcessing?: boolean;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  uploadedFiles,
  disabled = false,
  acceptedTypes = [".pdf", ".txt", ".md", ".doc", ".docx"],
  maxFileSize = 10
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (file.size > maxFileSize * 1024 * 1024) {
        onFileSelect(file, undefined);
        return;
      }

      setIsProcessing(true);
      try {
        let content: string | undefined;

        if (file.type === "application/pdf") {
          // For PDF files, use server-side extraction
          content = await extractPdfTextViaServer(file);
        } else if (file.type.startsWith("text/") || file.name.endsWith(".md")) {
          // For text files, read directly
          content = await file.text();
        }

        onFileSelect(file, content);
      } catch (error) {
        console.error("Error processing file:", error);
        onFileSelect(file, undefined);
      } finally {
        setIsProcessing(false);
      }
    },
    [maxFileSize, onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        handleFileSelect(files[0]);
        // Reset input
        e.target.value = "";
      }
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const triggerFileSelect = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-2">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={triggerFileSelect}
        disabled={disabled || isProcessing}
        className="h-8 w-8 p-0 rounded-full"
        aria-label="Attach file"
      >
        <Paperclip size={32} />
      </Button>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="p-2 bg-neutral-50 dark:bg-neutral-900">
              <div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-neutral-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatFileSize(uploadedFile.file.size)}
                      {uploadedFile.content && ` • Converted to Markdown (${uploadedFile.content.length} chars)`}
                    </p>
                    {uploadedFile.error && (
                      <p className="text-xs text-red-500 mt-1">
                        {uploadedFile.error}
                      </p>
                    )}
                  </div>
                  {uploadedFile.isProcessing ? (
                    <div className="animate-spin h-4 w-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full" />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileRemove(uploadedFile.id)}
                      className="h-6 w-6 p-0 text-neutral-500 hover:text-red-500"
                    >
                      <X size={12} />
                    </Button>
                  )}
                </div>
                
                {/* Show markdown preview for successfully processed files */}
                {uploadedFile.content && !uploadedFile.error && (
                  <MarkdownPreview 
                    content={uploadedFile.content}
                    filename={uploadedFile.file.name}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Drop Zone (when dragging) */}
      {isDragOver && (
        <div
          className={cn(
            "fixed inset-0 z-50 bg-black/20 backdrop-blur-sm",
            "flex items-center justify-center"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Card className="p-8 bg-white dark:bg-neutral-900 border-2 border-dashed border-neutral-300 dark:border-neutral-700">
            <div className="text-center space-y-4">
              <Paperclip size={48} className="mx-auto text-neutral-400" />
              <div>
                <p className="text-lg font-medium">Drop your file here</p>
                <p className="text-sm text-neutral-500">
                  PDFs will be converted to Markdown • Text files supported • Max {maxFileSize}MB
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Server-side PDF text extraction
async function extractPdfTextViaServer(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/extract-pdf", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      throw new Error(errorData.error || "Failed to extract PDF text");
    }

    const result = await response.json() as { text?: string };
    return result.text || "No text extracted from PDF";
  } catch (error) {
    console.error("Server PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF. Please try again.");
  }
}
