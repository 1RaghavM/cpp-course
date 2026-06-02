"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, StickyNote } from "lucide-react";

interface EngagementStripProps {
  tutorConversations: number;
  tutorMessages: number;
  notesWritten: number;
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="font-mono text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function EngagementStrip({ tutorConversations, tutorMessages, notesWritten }: EngagementStripProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Engagement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <MiniStat icon={<MessageSquare className="h-5 w-5" />} label="Conversations" value={tutorConversations} />
          <MiniStat icon={<Send className="h-5 w-5" />} label="Messages Sent" value={tutorMessages} />
          <MiniStat icon={<StickyNote className="h-5 w-5" />} label="Notes Written" value={notesWritten} />
        </div>
      </CardContent>
    </Card>
  );
}
