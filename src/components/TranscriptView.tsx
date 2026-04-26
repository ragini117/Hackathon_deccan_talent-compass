import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export type TranscriptMessage = {
  role: "recruiter" | "candidate";
  message: string;
  context?: string;
};

interface TranscriptViewProps {
  transcript: TranscriptMessage[];
  candidateName: string;
  outreachHook?: string;
}

export const TranscriptView = ({
  transcript,
  candidateName,
  outreachHook,
}: TranscriptViewProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = transcript
      .map((m) => `${m.role.toUpperCase()}: ${m.message}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Conversation copied to clipboard",
    });
  };

  const downloadAsText = () => {
    const text = `CONVERSATION OUTREACH WITH ${candidateName.toUpperCase()}\n${"=".repeat(50)}\n\n${
      outreachHook ? `OUTREACH HOOK:\n${outreachHook}\n\n` : ""
    }${transcript
      .map((m) => `${m.role.toUpperCase()}:\n${m.message}`)
      .join("\n\n")}`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidateName}-outreach.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!transcript || transcript.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No conversation available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Outreach Hook */}
      {outreachHook && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            💡 Outreach Hook
          </p>
          <p className="text-sm text-foreground">{outreachHook}</p>
        </div>
      )}

      {/* Conversation */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {transcript.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "recruiter" ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm transition-all ${
                message.role === "recruiter"
                  ? "bg-secondary text-secondary-foreground rounded-bl-sm shadow-sm"
                  : "gradient-primary text-primary-foreground rounded-br-sm shadow-lg"
              }`}
            >
              {message.context && (
                <div className="text-[11px] uppercase tracking-wider opacity-60 mb-1.5">
                  {message.context}
                </div>
              )}
              <div className="text-[11px] uppercase tracking-wider opacity-70 mb-1.5">
                {message.role}
              </div>
              <p className="leading-relaxed">{message.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t border-border/40">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex-1"
        >
          <Copy className="size-3 mr-2" />
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadAsText}
          className="flex-1"
        >
          <Download className="size-3 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
};
