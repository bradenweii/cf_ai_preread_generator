import { useState } from "react";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { Eye, EyeSlash } from "@phosphor-icons/react";

export interface MarkdownPreviewProps {
  content: string;
  filename: string;
}

export function MarkdownPreview({ content, filename }: MarkdownPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  const previewContent = isExpanded ? content : content.substring(0, 500);
  const needsTruncation = content.length > 500;

  return (
    <Card className="mt-2 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Markdown Preview: {filename}
        </h4>
        {needsTruncation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2 text-xs"
          >
            {isExpanded ? (
              <>
                <EyeSlash size={12} className="mr-1" />
                Collapse
              </>
            ) : (
              <>
                <Eye size={12} className="mr-1" />
                Expand
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <MemoizedMarkdown
          id={`preview-${filename}`}
          content={previewContent}
        />
        {needsTruncation && !isExpanded && (
          <p className="text-xs text-neutral-500 mt-2 italic">
            ... {content.length - 500} more characters
          </p>
        )}
      </div>
    </Card>
  );
}
