import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Mail, MessageCircle, Linkedin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface OutreachMessage {
  email?: {
    subject: string;
    body: string;
  };
  linkedin?: string;
  message?: string;
  key_talking_points?: string[];
  objection_handlers?: {
    salary?: string;
    location?: string;
    notice_period?: string;
  };
}

interface OutreachViewProps {
  outreach: OutreachMessage;
  candidateName: string;
}

export const OutreachView = ({ outreach, candidateName }: OutreachViewProps) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast({
      title: "Copied",
      description: `${section} copied to clipboard`,
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="size-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <Linkedin className="size-4" /> LinkedIn
          </TabsTrigger>
          <TabsTrigger value="message" className="flex items-center gap-2">
            <MessageCircle className="size-4" /> Message
          </TabsTrigger>
        </TabsList>

        {/* Email Tab */}
        {outreach.email && (
          <TabsContent value="email" className="space-y-3">
            <Card className="gradient-card border-border/60">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Subject
                    </label>
                    <div className="bg-background/60 rounded p-3 mt-1.5 border border-border/40 font-medium text-sm">
                      {outreach.email.subject}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Email Body
                    </label>
                    <div className="bg-background/60 rounded p-3 mt-1.5 border border-border/40 text-sm whitespace-pre-wrap leading-relaxed">
                      {outreach.email.body}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopy(
                        `Subject: ${outreach.email.subject}\n\n${outreach.email.body}`,
                        "Email"
                      )
                    }
                    className="w-full"
                  >
                    <Copy className="size-4 mr-2" />
                    {copiedSection === "Email" ? "Copied!" : "Copy Email"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* LinkedIn Tab */}
        {outreach.linkedin && (
          <TabsContent value="linkedin" className="space-y-3">
            <Card className="gradient-card border-border/60">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      LinkedIn Message
                    </label>
                    <div className="bg-background/60 rounded p-3 mt-1.5 border border-border/40 text-sm whitespace-pre-wrap leading-relaxed">
                      {outreach.linkedin}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopy(outreach.linkedin, "LinkedIn Message")
                    }
                    className="w-full"
                  >
                    <Copy className="size-4 mr-2" />
                    {copiedSection === "LinkedIn Message"
                      ? "Copied!"
                      : "Copy Message"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Message Tab */}
        {outreach.message && (
          <TabsContent value="message" className="space-y-3">
            <Card className="gradient-card border-border/60">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      WhatsApp / SMS Message
                    </label>
                    <div className="bg-background/60 rounded p-3 mt-1.5 border border-border/40 text-sm whitespace-pre-wrap leading-relaxed">
                      {outreach.message}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopy(outreach.message, "Message")
                    }
                    className="w-full"
                  >
                    <Copy className="size-4 mr-2" />
                    {copiedSection === "Message" ? "Copied!" : "Copy Message"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Talking Points */}
      {outreach.key_talking_points && outreach.key_talking_points.length > 0 && (
        <Card className="gradient-card border-border/60 bg-primary/5">
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              📝 Key Talking Points
            </h4>
            <ul className="space-y-2">
              {outreach.key_talking_points.map((point, idx) => (
                <li
                  key={idx}
                  className="text-sm text-foreground flex items-start gap-2"
                >
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Objection Handlers */}
      {outreach.objection_handlers && (
        <Card className="gradient-card border-border/60 bg-warning/5">
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold text-warning uppercase tracking-wider mb-3">
              ⚠️ Objection Handlers
            </h4>
            <div className="space-y-3">
              {outreach.objection_handlers.salary && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    💰 Salary Concerns
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {outreach.objection_handlers.salary}
                  </p>
                </div>
              )}
              {outreach.objection_handlers.location && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    📍 Location Concerns
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {outreach.objection_handlers.location}
                  </p>
                </div>
              )}
              {outreach.objection_handlers.notice_period && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    ⏱️ Notice Period Concerns
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {outreach.objection_handlers.notice_period}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
