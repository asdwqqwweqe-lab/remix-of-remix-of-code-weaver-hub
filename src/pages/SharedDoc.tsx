import { useParams } from "react-router-dom";
import { useSharedDoc } from "@/hooks/useLiveShare";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Radio } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet-async";

export default function SharedDoc() {
  const { token } = useParams<{ token: string }>();
  const { doc, loading, error, viewers } = useSharedDoc(token);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">تعذّر العثور على المستند</h1>
          <p className="text-muted-foreground">{error ?? "المستند غير متاح"}</p>
        </Card>
      </div>
    );
  }

  const title = doc.title || "مستند مشارك";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4 md:p-8">
      <Helmet>
        <title>{title} — عرض مباشر</title>
        <meta name="description" content={`عرض مباشر لـ ${title}`} />
      </Helmet>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">بث مباشر</span>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Users className="w-3 h-3" />
            {viewers} مشاهد
          </Badge>
        </div>

        <Card className="p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-6">{title}</h1>
          <SharedContent kind={doc.kind} content={doc.content} />
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          يُحدَّث المحتوى تلقائياً عند تعديل المالك
        </p>
      </div>
    </div>
  );
}

function SharedContent({ kind, content }: { kind: string; content: any }) {
  if (kind === "note" || kind === "markdown") {
    const text = typeof content === "string" ? content : content?.text ?? "";
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  }
  if (kind === "task" && Array.isArray(content?.items)) {
    return (
      <ul className="space-y-2">
        {content.items.map((item: any, i: number) => (
          <li key={i} className="flex items-center gap-2 p-2 rounded border">
            <input type="checkbox" checked={!!item.done} readOnly />
            <span className={item.done ? "line-through text-muted-foreground" : ""}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <pre className="text-xs bg-muted p-4 rounded overflow-auto">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}
