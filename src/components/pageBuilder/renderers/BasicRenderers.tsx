import { TextBlock, IconCardBlock, TableBlock, CardBlock, DividerBlock, ImageBlock, ListBlock, SpacerBlock, QuoteBlock, AlertBlock } from '@/types/pageBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, Quote as QuoteIcon } from 'lucide-react';

export const RenderText = ({ block }: { block: TextBlock }) => {
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

export const RenderIconCard = ({ block }: { block: IconCardBlock }) => {
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

export const RenderTable = ({ block }: { block: TableBlock }) => (
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

export const RenderCard = ({ block }: { block: CardBlock }) => {
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

export const RenderDivider = ({ block }: { block: DividerBlock }) => {
  if (block.style === 'gradient') {
    return <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent my-6" />;
  }
  return <hr className={cn('my-6 border-border', block.style === 'dashed' && 'border-dashed')} />;
};

export const RenderImage = ({ block }: { block: ImageBlock }) => (
  <figure className="space-y-2">
    <img src={block.src} alt={block.alt} className="w-full rounded-lg object-cover max-h-[500px]" loading="lazy" />
    {block.caption && <figcaption className="text-sm text-muted-foreground text-center">{block.caption}</figcaption>}
  </figure>
);

export const RenderList = ({ block }: { block: ListBlock }) => {
  const Tag = block.ordered ? 'ol' : 'ul';
  return (
    <Tag className={cn('space-y-1.5 ps-6', block.ordered ? 'list-decimal' : 'list-disc')}>
      {block.items.map((item, i) => (
        <li key={i} className="text-muted-foreground">{item}</li>
      ))}
    </Tag>
  );
};

export const RenderSpacer = ({ block }: { block: SpacerBlock }) => {
  const sizes = { sm: 'h-4', md: 'h-8', lg: 'h-16', xl: 'h-24' };
  return <div className={sizes[block.size]} />;
};

export const RenderQuote = ({ block }: { block: QuoteBlock }) => (
  <blockquote className="border-s-4 border-primary/50 ps-4 py-2 my-4">
    <QuoteIcon className="w-6 h-6 text-primary/40 mb-2" />
    <p className="text-lg italic text-foreground/80">{block.text}</p>
    {block.author && <cite className="text-sm text-muted-foreground mt-2 block">— {block.author}</cite>}
  </blockquote>
);

export const RenderAlert = ({ block }: { block: AlertBlock }) => {
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
