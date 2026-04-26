import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, MessageSquare, Sparkles, MapPin, Clock, IndianRupee, Send, Loader2 } from "lucide-react";
import { TranscriptView } from "@/components/TranscriptView";
import { OutreachView } from "@/components/OutreachView";
import { toast } from "@/hooks/use-toast";

export type CandidateResult = {
  name: string;
  match_score: number;
  match_breakdown: { skill: number; experience: number; domain: number };
  match_reasoning: string;
  interest_score: number;
  interest_level: "Yes" | "Maybe" | "No";
  notice_period: string;
  expected_salary: string;
  location_open: "Yes" | "Maybe" | "No";
  interest_reasoning: string;
  final_score: number;
  outreach_hook?: string;
  transcript: { role: "recruiter" | "candidate"; message: string }[];
};

const interestVariant = (lvl: string) =>
  lvl === "Yes" ? "bg-success/15 text-success border-success/30" :
  lvl === "Maybe" ? "bg-warning/15 text-warning border-warning/30" :
  "bg-destructive/15 text-destructive border-destructive/30";

export const CandidateCard = ({ c, rank, jd }: { c: CandidateResult; rank: number; jd?: string }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachData, setOutreachData] = useState<any>(null);

  const generateOutreach = async () => {
    setOutreachLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate: c,
          jd: jd || "Job description not available",
          matchContext: {
            match_score: c.match_score,
            interest_level: c.interest_level,
            reasoning: c.match_reasoning,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate outreach");
      }

      setOutreachData(data);
      setOutreachOpen(true);

      toast({
        title: "Outreach generated",
        description: "Personalized messages ready",
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setOutreachLoading(false);
    }
  };

  return (
    <Card className="gradient-card border-border/60 shadow-elegant overflow-hidden transition-smooth hover:border-primary/50 hover:shadow-glow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl gradient-primary flex items-center justify-center font-bold text-primary-foreground shadow-glow">
              #{rank}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{c.name}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className={interestVariant(c.interest_level)}>
                  <Sparkles className="size-3 mr-1" /> {c.interest_level}
                </Badge>
                <Badge variant="outline" className="border-border/60">
                  <Clock className="size-3 mr-1" /> {c.notice_period}
                </Badge>
                <Badge variant="outline" className="border-border/60">
                  <IndianRupee className="size-3 mr-1" /> {c.expected_salary}
                </Badge>
                <Badge variant="outline" className="border-border/60">
                  <MapPin className="size-3 mr-1" /> Location: {c.location_open}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-gradient leading-none">{c.final_score}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Final Score</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="rounded-lg bg-muted/30 p-4 border border-border/40">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Match Score</span>
              <span className="font-semibold">{c.match_score}/100</span>
            </div>
            <Progress value={c.match_score} className="h-1.5" />
            {c.match_breakdown && (
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-muted-foreground">
                <div>Skills <span className="text-foreground font-medium">{c.match_breakdown.skill || '—'}</span></div>
                <div>Exp <span className="text-foreground font-medium">{c.match_breakdown.experience || '—'}</span></div>
                <div>Domain <span className="text-foreground font-medium">{c.match_breakdown.domain || '—'}</span></div>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-muted/30 p-4 border border-border/40">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Interest Score</span>
              <span className="font-semibold">{c.interest_score}/100</span>
            </div>
            <Progress value={c.interest_score} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{c.interest_reasoning}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          <span className="text-foreground font-medium">Why: </span>{c.match_reasoning}
        </p>

        <div className="flex gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => setChatOpen((o) => !o)}
          >
            <MessageSquare className="size-4 mr-2" />
            {chatOpen ? "Hide" : "View"} Chat
            <ChevronDown className={`size-4 ml-1 transition-transform ${chatOpen ? "rotate-180" : ""}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-success hover:text-success hover:bg-success/10"
            onClick={generateOutreach}
            disabled={outreachLoading}
          >
            {outreachLoading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Generate Outreach
              </>
            )}
          </Button>
        </div>

        {chatOpen && c.transcript && Array.isArray(c.transcript) && (
          <div className="mt-4 rounded-lg border border-border/40 bg-background/40 p-4">
            <TranscriptView
              transcript={c.transcript}
              candidateName={c.name}
              outreachHook={c.outreach_hook}
            />
          </div>
        )}

        {outreachOpen && outreachData && (
          <div className="mt-4 rounded-lg border border-border/40 bg-background/40 p-4">
            <OutreachView outreach={outreachData} candidateName={c.name} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};