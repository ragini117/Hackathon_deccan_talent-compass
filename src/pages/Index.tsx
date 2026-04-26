import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Sparkles,
  Upload,
  FileText,
  Loader2,
  Brain,
  Users,
  MessageCircle,
  Trophy,
} from "lucide-react";
import { CandidateCard, type CandidateResult } from "@/components/CandidateCard";

const SAMPLE_JD = `We're hiring a Senior Frontend Engineer in Bangalore.
You'll own our React + TypeScript web app, drive performance, and partner with design.
Required: 5+ years React, strong TypeScript, Next.js or similar, experience leading frontend architecture.
Nice to have: GraphQL, AWS, design systems.
Education: B.Tech / B.E. in Computer Science or equivalent.`;

const Index = () => {
  const [jd, setJd] = useState(SAMPLE_JD);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CandidateResult[] | null>(null);
  const [jdParsed, setJdParsed] = useState<any>(null);

  const onFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setCandidates(res.data as any[]);
        setFileName(file.name);
        toast({
          title: "CSV loaded",
          description: `${res.data.length} candidates ready.`,
        });
      },
      error: (err) =>
        toast({
          title: "CSV error",
          description: err.message,
          variant: "destructive",
        }),
    });
  };

  const loadSample = async () => {
    const res = await fetch("/sample-candidates.csv");
    const text = await res.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    setCandidates(parsed.data as any[]);
    setFileName("sample-candidates.csv");

    toast({
      title: "Sample loaded",
      description: `${parsed.data.length} candidates.`,
    });
  };

  const run = async () => {
    if (!jd.trim()) {
      return toast({
        title: "JD missing",
        description: "Paste a job description first.",
        variant: "destructive",
      });
    }

    if (candidates.length === 0) {
      return toast({
        title: "No candidates",
        description: "Upload a CSV or load sample.",
        variant: "destructive",
      });
    }

    setLoading(true);
    setResults(null);
    setJdParsed(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/scout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jd,
          candidates,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Scouting failed");
      }

      setResults(data.ranked_candidates);
      setJdParsed(data.parsed_jd);

      toast({
        title: "Shortlist ready",
        description: `Ranked ${data.ranked_candidates.length} candidates.`,
      });
    } catch (e: any) {
      toast({
        title: "Scouting failed",
        description: e.message ?? "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <header className="container max-w-6xl pt-16 pb-10">
        <Badge
          variant="outline"
          className="border-primary/40 bg-primary/10 text-primary mb-6"
        >
          <Sparkles className="size-3 mr-1" /> AI Talent Scouting Agent
        </Badge>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Match, engage, and rank
          <br />
          candidates in <span className="text-gradient">one click</span>
        </h1>

        <p className="text-lg text-muted-foreground mt-5 max-w-2xl">
          Paste a job description, upload candidates, and let the agent parse,
          score, simulate outreach, and deliver an explainable shortlist.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 text-sm">
          {[
            { icon: Brain, label: "JD parsing" },
            { icon: Users, label: "Skill matching" },
            { icon: MessageCircle, label: "Simulated chat" },
            { icon: Trophy, label: "Final ranking" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 px-4 py-3"
            >
              <Icon className="size-4 text-primary" />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </header>

      <section className="container max-w-6xl grid md:grid-cols-2 gap-6 pb-10">
        <Card className="gradient-card border-border/60 shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="size-5 text-primary" />
              <h2 className="font-semibold text-lg">Job Description</h2>
            </div>

            <Textarea
              id="job-description"
              name="job-description"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the JD here..."
              className="min-h-[260px] bg-background/60 border-border/60 resize-none"
            />
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/60 shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="size-5 text-primary" />
              <h2 className="font-semibold text-lg">Candidates (CSV)</h2>
            </div>

            <label className="block cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={(e) =>
                  e.target.files?.[0] && onFile(e.target.files[0])
                }
              />

              <div className="rounded-xl border-2 border-dashed border-border/60 hover:border-primary/60 transition-smooth p-10 text-center bg-background/30">
                <Upload className="size-8 mx-auto text-muted-foreground" />
                <p className="mt-3 font-medium">Drop or browse CSV</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected columns: name, skills, experience_years, location,
                  education, projects…
                </p>
              </div>
            </label>

            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">
                {fileName ? (
                  <>
                    📄 {fileName} —{" "}
                    <span className="text-foreground">
                      {candidates.length} candidates
                    </span>
                  </>
                ) : (
                  "No file loaded"
                )}
              </span>

              <Button
                variant="link"
                size="sm"
                onClick={loadSample}
                className="text-primary"
              >
                Use sample data
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container max-w-6xl pb-12">
        <Button
          size="lg"
          onClick={run}
          disabled={loading}
          className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-smooth h-14 px-8 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 mr-2 animate-spin" /> Scouting
              candidates…
            </>
          ) : (
            <>
              <Sparkles className="size-5 mr-2" /> Run Scouting Agent
            </>
          )}
        </Button>

        {loading && (
          <p className="text-sm text-muted-foreground mt-3">
            Parsing JD → matching {candidates.length} candidates → simulating
            outreach → ranking.
          </p>
        )}
      </section>

      {jdParsed && (
        <section className="container max-w-6xl pb-8">
          <Card className="gradient-card border-border/60">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Brain className="size-4 text-primary" /> Parsed JD
              </h3>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Role: </span>
                  {jdParsed.job_title}
                </div>

                <div>
                  <span className="text-muted-foreground">Experience: </span>
                  {jdParsed.experience_required}
                </div>

                <div>
                  <span className="text-muted-foreground">Location: </span>
                  {jdParsed.location}
                </div>

                <div>
                  <span className="text-muted-foreground">Education: </span>
                  {jdParsed.education || "Not specified"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {jdParsed.required_skills?.map((s: string) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary-foreground"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {results && (
        <section className="container max-w-6xl pb-20">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="size-6 text-primary" /> Ranked Shortlist
          </h2>

          <div className="space-y-4">
            {results.map((c, i) => (
              <CandidateCard key={c.name + i} c={c} rank={i + 1} jd={jd} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default Index;