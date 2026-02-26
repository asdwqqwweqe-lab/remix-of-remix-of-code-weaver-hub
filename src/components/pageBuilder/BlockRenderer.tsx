import { Block, TextBlock, IconCardBlock, TableBlock, CardBlock, DividerBlock, ImageBlock, VideoBlock, ButtonBlock, AccordionBlock, TabsBlock, CodeBlock as CodeBlockType, QuoteBlock, AlertBlock, ListBlock, SpacerBlock } from '@/types/pageBuilder';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import hljs from 'highlight.js';
import { useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, ExternalLink, Quote as QuoteIcon, Copy } from 'lucide-react';

interface BlockRendererProps {
  block: Block;
  isPreview?: boolean;
}

const RenderText = ({ block }: { block: TextBlock }) => {
  const Tag = block.level === 'p' ? 'p' : block.level;
  const classes: Record<string, string> = {
    h1: 'text-3xl md:text-4xl font-bold mb-4',
    h2: 'text-2xl md:text-3xl font-semibold mb-3',
    h3: 'text-xl md:text-2xl font-semibold mb-2',
    h4: 'text-lg md:text-xl font-medium mb-2',
    p: 'text-base leading-relaxed text-muted-foreground',
  };
  return <Tag className={classes[block.level]}>{block.content}</Tag>;
};

const RenderIconCard = ({ block }: { block: IconCardBlock }) => {
  const IconComp = (Icons as any)[block.icon] || Icons.Star;
  return (
    <Card className="card-hover border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
          <IconComp className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">{block.title}</h3>
        <p className="text-muted-foreground text-sm">{block.description}</p>
      </CardContent>
    </Card>
  );
};

const RenderTable = ({ block }: { block: TableBlock }) => (
  <div className="overflow-x-auto rounded-lg border border-border">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted/50">
          {block.headers.map((h, i) => (
            <th key={i} className="px-4 py-3 text-start font-semibold border-b border-border">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.rows.map((row, ri) => (
          <tr key={ri} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
            {row.map((cell, ci) => (
              <td key={ci} className="px-4 py-3">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const RenderCard = ({ block }: { block: CardBlock }) => {
  const variantClasses = {
    default: 'border-border',
    primary: 'border-primary/50 bg-primary/5',
    accent: 'border-accent/50 bg-accent/5',
  };
  return (
    <Card className={cn('card-hover', variantClasses[block.variant])}>
      <CardHeader><CardTitle>{block.title}</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">{block.content}</p></CardContent>
    </Card>
  );
};

const RenderDivider = ({ block }: { block: DividerBlock }) => {
  if (block.style === 'gradient') {
    return <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent my-6" />;
  }
  return <hr className={cn('my-6 border-border', block.style === 'dashed' && 'border-dashed')} />;
};

const RenderImage = ({ block }: { block: ImageBlock }) => (
  <figure className="space-y-2">
    <img src={block.src} alt={block.alt} className="w-full rounded-lg object-cover max-h-[500px]" loading="lazy" />
    {block.caption && <figcaption className="text-sm text-muted-foreground text-center">{block.caption}</figcaption>}
  </figure>
);

const RenderVideo = ({ block }: { block: VideoBlock }) => {
  let embedUrl = block.url;
  if (block.provider === 'youtube') {
    const match = block.url.match(/(?:v=|\/)([\w-]{11})/);
    if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
  } else if (block.provider === 'vimeo') {
    const match = block.url.match(/vimeo\.com\/(\d+)/);
    if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
  }
  return (
    <div className="space-y-2">
      {block.title && <h4 className="font-medium">{block.title}</h4>}
      {block.provider === 'direct' ? (
        <video src={block.url} controls className="w-full rounded-lg" />
      ) : (
        <div className="aspect-video rounded-lg overflow-hidden border border-border">
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
        </div>
      )}
    </div>
  );
};

const RenderButton = ({ block }: { block: ButtonBlock }) => {
  const sizeClasses = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-5 text-sm', lg: 'h-12 px-8 text-base' };
  const variantClasses = {
    default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground',
    gradient: 'bg-gradient-primary text-primary-foreground hover:opacity-90',
  };
  return (
    <div className="flex justify-center">
      <a href={block.url} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center justify-center rounded-lg font-medium transition-all gap-2', sizeClasses[block.size], variantClasses[block.variant])}>
        {block.text}
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
};

const RenderAccordion = ({ block }: { block: AccordionBlock }) => (
  <Accordion type="multiple" className="w-full">
    {block.items.map((item) => (
      <AccordionItem key={item.id} value={item.id}>
        <AccordionTrigger className="text-start">{item.question}</AccordionTrigger>
        <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

const RenderTabs = ({ block }: { block: TabsBlock }) => (
  <Tabs defaultValue={block.items[0]?.id} className="w-full">
    <TabsList className="w-full justify-start">
      {block.items.map((item) => (
        <TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>
      ))}
    </TabsList>
    {block.items.map((item) => (
      <TabsContent key={item.id} value={item.id} className="p-4 text-muted-foreground">
        {item.content}
      </TabsContent>
    ))}
  </Tabs>
);

const RenderCode = ({ block }: { block: CodeBlockType }) => {
  const codeRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [block.code, block.language]);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {block.filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
          <span className="text-xs font-mono text-muted-foreground">{block.filename}</span>
          <button onClick={() => navigator.clipboard.writeText(block.code)} className="text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <pre className="!m-0 !rounded-none"><code ref={codeRef} className={`language-${block.language} !bg-transparent`}>{block.code}</code></pre>
    </div>
  );
};

const RenderQuote = ({ block }: { block: QuoteBlock }) => (
  <blockquote className="border-s-4 border-primary/50 ps-4 py-2 my-4">
    <QuoteIcon className="w-6 h-6 text-primary/40 mb-2" />
    <p className="text-lg italic text-foreground/80">{block.text}</p>
    {block.author && <cite className="text-sm text-muted-foreground mt-2 block">— {block.author}</cite>}
  </blockquote>
);

const RenderAlert = ({ block }: { block: AlertBlock }) => {
  const config = {
    info: { icon: Info, className: 'border-info/50 bg-info/5 text-info' },
    success: { icon: CheckCircle, className: 'border-success/50 bg-success/5 text-success' },
    warning: { icon: AlertTriangle, className: 'border-warning/50 bg-warning/5 text-warning' },
    error: { icon: AlertCircle, className: 'border-destructive/50 bg-destructive/5 text-destructive' },
  }[block.alertType];
  const Icon = config.icon;
  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-lg border', config.className)}>
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <p className="text-sm">{block.message}</p>
    </div>
  );
};

const RenderList = ({ block }: { block: ListBlock }) => {
  const Tag = block.ordered ? 'ol' : 'ul';
  return (
    <Tag className={cn('space-y-1.5 ps-6', block.ordered ? 'list-decimal' : 'list-disc')}>
      {block.items.map((item, i) => (
        <li key={i} className="text-muted-foreground">{item}</li>
      ))}
    </Tag>
  );
};

const RenderSpacer = ({ block }: { block: SpacerBlock }) => {
  const sizes = { sm: 'h-4', md: 'h-8', lg: 'h-16', xl: 'h-24' };
  return <div className={sizes[block.size]} />;
};

export default function BlockRenderer({ block, isPreview }: BlockRendererProps) {
  const renderers: Record<string, (b: any) => JSX.Element> = {
    text: (b) => <RenderText block={b} />,
    'icon-card': (b) => <RenderIconCard block={b} />,
    table: (b) => <RenderTable block={b} />,
    card: (b) => <RenderCard block={b} />,
    divider: (b) => <RenderDivider block={b} />,
    image: (b) => <RenderImage block={b} />,
    video: (b) => <RenderVideo block={b} />,
    button: (b) => <RenderButton block={b} />,
    accordion: (b) => <RenderAccordion block={b} />,
    tabs: (b) => <RenderTabs block={b} />,
    code: (b) => <RenderCode block={b} />,
    quote: (b) => <RenderQuote block={b} />,
    alert: (b) => <RenderAlert block={b} />,
    list: (b) => <RenderList block={b} />,
    spacer: (b) => <RenderSpacer block={b} />,
  };

  const render = renderers[block.type];
  if (!render) return null;
  return <div className="animate-fade-in">{render(block)}</div>;
}
