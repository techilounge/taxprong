import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  engagement_id: string;
  sender_id: string;
  body: string;
  file_url: string | null;
  created_at: string;
  sender?: {
    name: string;
    email: string;
  };
}

interface MessageThread {
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

export function useMessages(proId: string, userId: string) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // Get all engagements for this pro
      const { data: engagements, error: engError } = await supabase
        .from("engagements")
        .select(`
          id,
          scope,
          client:clients(
            profile:person_user_id(name),
            business:business_id(name)
          )
        `)
        .eq("pro_id", proId)
        .is("deleted_at", null);

      if (engError) throw engError;

      // Get messages for all engagements
      const threadsData = await Promise.all(
        (engagements || []).map(async (engagement) => {
          const { data: messages, error: msgError } = await supabase
            .from("messages")
            .select(`
              *,
              sender:sender_id(name, email)
            `)
            .eq("engagement_id", engagement.id)
            .order("created_at", { ascending: false });

          if (msgError) throw msgError;

          return {
            engagement_id: engagement.id,
            engagement,
            messages: messages || [],
            lastMessage: messages?.[0],
            unreadCount: 0, // TODO: Implement unread tracking
          };
        })
      );

      setThreads(threadsData.filter(t => t.messages.length > 0));
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (proId && userId) {
      loadMessages();

      // Set up realtime subscription
      const channel = supabase
        .channel("messages-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          () => {
            loadMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [proId, userId]);

  const sendMessage = async (engagementId: string, body: string, fileUrl?: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          engagement_id: engagementId,
          sender_id: userId,
          body,
          file_url: fileUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Message sent");
      return data;
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      throw error;
    }
  };

  return {
    threads,
    loading,
    reload: loadMessages,
    sendMessage,
  };
}
