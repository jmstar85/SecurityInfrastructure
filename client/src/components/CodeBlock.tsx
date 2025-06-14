import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
  className?: string;
}

export default function CodeBlock({ code, language, title, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="absolute top-2 right-2 z-10 h-8 w-8 p-0"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        
        {title && (
          <div className="bg-muted px-4 py-2 border-b text-sm font-medium text-muted-foreground">
            {title}
          </div>
        )}
        
        <pre className="bg-muted/50 p-4 overflow-x-auto text-sm">
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </Card>
  );
}
