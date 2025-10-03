import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Search, FileText, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Citation {
  title: string;
  ref: string;
}

interface Chunk {
  text: string;
  score: number;
  doc_title: string;
  chunk_index: number;
}

interface TaxQAPanelProps {
  orgId: string | null;
  returnId?: string;
  returnType?: "vat" | "pit" | "cit";
  onInsertNote?: (answer: string, citations: Citation[]) => void;
  className?: string;
}

export function TaxQAPanel({ orgId, returnId, returnType, onInsertNote, className }: TaxQAPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [docPreviewOpen, setDocPreviewOpen] = useState(false);
  const { toast } = useToast();

  const handleAsk = async () => {
    if (!query.trim()) {
      toast({ title: "Error", description: "Please enter a question", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      setAnswer("");
      setCitations([]);
      setChunks([]);

      const { data, error } = await supabase.functions.invoke("answer-with-citations", {
        body: {
          query: query.trim(),
          org_id: orgId,
          session_id: returnId || crypto.randomUUID(),
        },
      });

      if (error) throw error;

      setAnswer(data.answer);
      setCitations(data.citations || []);
      setChunks(data.chunks || []);
    } catch (error: any) {
      console.error("Error asking question:", error);
      toast({ title: "Error", description: error.message || "Failed to generate answer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInsertNote = () => {
    if (onInsertNote) {
      onInsertNote(answer, citations);
      toast({ title: "Success", description: "Q&A inserted as note" });
    } else {
      toast({ title: "Info", description: "Note insertion not configured for this page" });
    }
  };

  const getCitationChunk = (title: string, ref: string): Chunk | undefined => {
    const chunkIndex = parseInt(ref.replace("§", ""));
    return chunks.find(chunk => chunk.doc_title === title && chunk.chunk_index === chunkIndex);
  };

  const openDocPreview = (citation: Citation) => {
    const chunk = getCitationChunk(citation.title, citation.ref);
    if (chunk) {
      setSelectedChunk(chunk);
      setDocPreviewOpen(true);
    }
  };

  const renderAnswerWithCitations = () => {
    if (!answer) return null;

    // Split answer by citation pattern and reconstruct with clickable citations
    const citationRegex = /\[([^\]]+?) §(\d+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(answer)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {answer.substring(lastIndex, match.index)}
          </span>
        );
      }

      const title = match[1];
      const ref = `§${match[2]}`;
      const chunk = getCitationChunk(title, ref);

      // Add citation as superscript
      parts.push(
        <TooltipProvider key={`citation-${match.index}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <sup
                className="text-primary cursor-pointer hover:underline font-medium mx-0.5"
                onClick={() => openDocPreview({ title, ref })}
              >
                [{title} {ref}]
              </sup>
            </TooltipTrigger>
            {chunk && (
              <TooltipContent side="top" className="max-w-md">
                <p className="text-xs">{chunk.text.substring(0, 200)}...</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < answer.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {answer.substring(lastIndex)}
        </span>
      );
    }

    return <div className="whitespace-pre-wrap leading-relaxed">{parts}</div>;
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Ask a Tax Question</CardTitle>
              <CardDescription className="text-xs">Get AI-powered answers with citations</CardDescription>
            </div>
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="e.g., Is this service zero-rated or exempt?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
            <Button onClick={handleAsk} disabled={loading} className="w-full" size="sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-3 w-3" />
                  Ask
                </>
              )}
            </Button>
          </div>

          {answer && (
            <div className="space-y-3 pt-3 border-t">
              <div className="prose prose-sm max-w-none text-sm">
                {renderAnswerWithCitations()}
              </div>

              {citations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">Citations:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {citations.map((cite, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-secondary/80"
                        onClick={() => openDocPreview(cite)}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        {cite.title} {cite.ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {onInsertNote && (
                <Button onClick={handleInsertNote} variant="outline" size="sm" className="w-full">
                  <Plus className="mr-2 h-3 w-3" />
                  Insert as Note
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <Dialog open={docPreviewOpen} onOpenChange={setDocPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">
                {selectedChunk?.doc_title} §{selectedChunk?.chunk_index}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDocPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              Document excerpt (Relevance: {selectedChunk?.score.toFixed(3)})
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 bg-muted/30 rounded-lg">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {selectedChunk?.text}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}