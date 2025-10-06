import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "./EmptyState";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { MessageThread } from "./MessageThread";

interface Message {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
}

interface Thread {
  engagement_id: string;
  engagement?: {
    scope: string | null;
    client?: {
      profile?: {
        name: string;
      };
      business?: {
        name: string;
      };
    };
  };
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

interface MessagesListProps {
  threads: Thread[];
  loading: boolean;
  userId: string;
  onSendMessage: (engagementId: string, body: string) => Promise<any>;
}

export const MessagesList = ({ threads, loading, userId, onSendMessage }: MessagesListProps) => {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading messages...</div>;
  }

  if (threads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No messages yet"
        description="Start a conversation with your clients through engagements"
      />
    );
  }

  const currentThread = threads.find(t => t.engagement_id === selectedThread);

  if (currentThread) {
    return (
      <MessageThread
        thread={currentThread}
        userId={userId}
        onBack={() => setSelectedThread(null)}
        onSendMessage={onSendMessage}
      />
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => {
        const clientName = thread.engagement?.client?.profile?.name || 
                         thread.engagement?.client?.business?.name || 
                         "Unknown Client";
        
        return (
          <Card
            key={thread.engagement_id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setSelectedThread(thread.engagement_id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{clientName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {thread.engagement?.scope || "No scope"}
                  </p>
                </div>
                {thread.unreadCount > 0 && (
                  <Badge>{thread.unreadCount}</Badge>
                )}
              </div>
            </CardHeader>
            {thread.lastMessage && (
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {thread.lastMessage.body}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(thread.lastMessage.created_at), { addSuffix: true })}
                </p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
