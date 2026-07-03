import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Radio, Copy, StopCircle, Users, Loader2 } from "lucide-react";
import { useLiveShareOwner, type SharedDocKind } from "@/hooks/useLiveShare";
import { toast } from "sonner";

interface Props {
  kind: SharedDocKind;
  title: string;
  getContent: () => any;
  /** live content — pushes updates while sharing */
  liveContent?: any;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function ShareLiveButton({
  kind,
  title,
  getContent,
  liveContent,
  variant = "outline",
  size = "sm",
}: Props) {
  const { shareToken, creating, viewers, startSharing, pushUpdate, stopSharing } =
    useLiveShareOwner(kind);
  const [open, setOpen] = useState(false);

  const shareUrl = shareToken
    ? `${window.location.origin}/s/${shareToken}`
    : "";

  useEffect(() => {
    if (shareToken && liveContent !== undefined) pushUpdate(liveContent);
  }, [shareToken, liveContent, pushUpdate]);

  const onStart = async () => {
    try {
      await startSharing(title, getContent());
      setOpen(true);
      toast.success("بدأ البث المباشر");
    } catch (e: any) {
      toast.error(e?.message ?? "فشل بدء المشاركة");
    }
  };

  const onCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("نُسخ الرابط");
  };

  const onStop = async () => {
    await stopSharing();
    setOpen(false);
    toast.info("توقّف البث المباشر");
  };

  if (!shareToken) {
    return (
      <Button variant={variant} size={size} onClick={onStart} disabled={creating}>
        {creating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Radio className="w-4 h-4" />
        )}
        <span className="ms-2">شارك مباشرة</span>
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size={size} className="gap-2">
          <Radio className="w-4 h-4 text-primary animate-pulse" />
          <span>مباشر</span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            {viewers}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div>
          <p className="text-sm font-medium mb-1">رابط المشاركة</p>
          <div className="flex gap-2">
            <Input readOnly value={shareUrl} className="text-xs" />
            <Button size="icon" variant="outline" onClick={onCopy}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {viewers} مشاهد الآن
          </span>
        </div>
        <Button variant="destructive" size="sm" onClick={onStop} className="w-full">
          <StopCircle className="w-4 h-4 me-2" />
          أوقف البث
        </Button>
      </PopoverContent>
    </Popover>
  );
}
