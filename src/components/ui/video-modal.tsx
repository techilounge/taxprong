import { useState } from "react";
import ReactPlayer from "react-player/youtube";
import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoModalProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
  triggerClassName?: string;
}

export const VideoModal = ({
  videoUrl,
  thumbnailUrl,
  title = "Watch Demo",
  triggerClassName,
}: VideoModalProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn("gap-2", triggerClassName)}
        >
          <Play className="h-5 w-5" />
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <div className="aspect-video">
          <ReactPlayer
            url={videoUrl}
            width="100%"
            height="100%"
            controls
            playing={open}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
