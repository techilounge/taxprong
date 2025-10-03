import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";

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

export default function TaxQA() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const { toast } = useToast();
  const { organization } = useOrganization();

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
          org_id: organization?.id || null,
          session_id: crypto.randomUUID(),
        },
      });

      if (error) throw error;

      setAnswer(data.answer);
      setCitations(data.citations || []);
      setChunks(data.chunks || []);

      toast({ title: "Success", description: "Answer generated with citations" });
    } catch (error: any) {
      console.error("Error asking question:", error);
      toast({ title: "Error", description: error.message || "Failed to generate answer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tax Q&A with Citations</h1>
          <p className="text-muted-foreground">Ask questions about Nigeria tax law and get cited answers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ask a Question</CardTitle>
            <CardDescription>Enter your tax-related question below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="e.g., What is the VAT rate for exported services?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button onClick={handleAsk} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Answer...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Ask Question
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {answer && (
          <Card>
            <CardHeader>
              <CardTitle>Answer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{answer}</p>
              </div>

              {citations.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-semibold text-sm">Citations:</h3>
                  <div className="flex flex-wrap gap-2">
                    {citations.map((cite, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <FileText className="mr-1 h-3 w-3" />
                        {cite.title} {cite.ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {chunks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Source Chunks</CardTitle>
              <CardDescription>Relevant document sections used to generate the answer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chunks.map((chunk, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {chunk.doc_title} §{chunk.chunk_index}
                      </Badge>
                      <Badge variant="secondary">Score: {chunk.score.toFixed(3)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{chunk.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}