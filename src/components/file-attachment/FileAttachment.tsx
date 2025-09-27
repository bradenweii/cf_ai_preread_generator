import { FileText, CheckCircle, XCircle } from "@phosphor-icons/react";
import { Card } from "@/components/card/Card";

export interface FileAttachmentProps {
  filename: string;
  hasContent: boolean;
  error?: string;
}

export function FileAttachment({ filename, hasContent, error }: FileAttachmentProps) {
  return (
    <Card className="inline-flex items-center gap-2 p-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
      <FileText size={16} className="text-neutral-500 dark:text-neutral-400" />
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {filename}
      </span>
      {error ? (
        <XCircle size={14} className="text-red-500" />
      ) : hasContent ? (
        <CheckCircle size={14} className="text-green-500" />
      ) : (
        <XCircle size={14} className="text-orange-500" />
      )}
    </Card>
  );
}
