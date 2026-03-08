import { AccordionBlock, TabsBlock, CodeBlock as CodeBlockType, HeroBlock, ProgressBlock, StatsBlock, TimelineBlock, PricingBlock, TestimonialBlock, KanbanBlock } from '@/types/pageBuilder';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import hljs from 'highlight.js';
import { useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { ExternalLink, Copy, Star, Check, X } from 'lucide-react';

export const RenderAccordion = ({ block }: { block: AccordionBlock }) => (
  <Accordion type="multiple" className="w-full">
    {block.items.map((item) => (
      <AccordionItem key={item.id} value={item.id}>
        <AccordionTrigger className="text-start">{item.question}</AccordionTrigger>
        <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

export const RenderTabs = ({ block }: { block: TabsBlock }) => (
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

export const RenderCode = ({ block }: { block: CodeBlockType }) => {
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

export const RenderHero = ({ block }: { block: HeroBlock }) => {
  const bgClasses = {
    default: 'bg-muted/30',
    gradient: 'bg-gradient-to-br from-primary/20 via-primary/5 to-accent/20',
    image: '',
  };
  return (
    <div
      className={cn('relative rounded-2xl overflow-hidden py-16 px-8 text-center', bgClasses[block.variant])}
      style={block.variant === 'image' && block.backgroundImage ? { backgroundImage: `url(${block.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {block.variant === 'image' && <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />}
      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold">{block.title}</h1>
        {block.subtitle && <p className="text-lg md:text-xl text-muted-foreground">{block.subtitle}</p>}
        {block.buttonText && (
          <div className="pt-4">
            <a href={block.buttonUrl || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-12 px-8 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              {block.buttonText}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export const RenderProgress = ({ block }: { block: ProgressBlock }) => {
  const colorClasses = {
    default: '[&>div]:bg-foreground',
    primary: '[&>div]:bg-primary',
    success: '[&>div]:bg-green-500',
    warning: '[&>div]:bg-yellow-500',
  };
  const percentage = Math.min(100, Math.round((block.value / block.max) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{block.label}</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className={cn('h-3', colorClasses[block.variant])} />
    </div>
  );
};

export const RenderStats = ({ block }: { block: StatsBlock }) => (
  <div className={cn('grid gap-4', block.items.length <= 2 ? 'grid-cols-2' : block.items.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4')}>
    {block.items.map((item) => {
      const IconComp = item.icon ? (Icons as any)[item.icon] || Icons.Hash : Icons.Hash;
      return (
        <Card key={item.id} className="card-hover border-border/50">
          <CardContent className="p-5 flex flex-col items-center text-center gap-2">
            <IconComp className="w-6 h-6 text-primary/60" />
            <span className="text-2xl md:text-3xl font-bold">{item.value}</span>
            <span className="text-sm text-muted-foreground">{item.label}</span>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

export const RenderTimeline = ({ block }: { block: TimelineBlock }) => (
  <div className="relative ps-8 space-y-6">
    <div className="absolute start-3 top-2 bottom-2 w-px bg-border" />
    {block.items.map((item) => (
      <div key={item.id} className="relative">
        <div className="absolute start-[-1.625rem] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
        <div className="space-y-1">
          {item.date && <span className="text-xs text-muted-foreground font-mono">{item.date}</span>}
          <h4 className="font-semibold">{item.title}</h4>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
      </div>
    ))}
  </div>
);

export const RenderPricing = ({ block }: { block: PricingBlock }) => (
  <Card className={cn('card-hover max-w-sm mx-auto', block.highlighted ? 'border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20' : 'border-border/50')}>
    {block.highlighted && (
      <div className="bg-primary text-primary-foreground text-xs text-center py-1.5 font-medium">
        ⭐ Featured
      </div>
    )}
    <CardContent className="p-6 space-y-4 text-center">
      <h3 className="text-xl font-bold">{block.title}</h3>
      <div>
        <span className="text-4xl font-bold">{block.price}</span>
        {block.period && <span className="text-muted-foreground text-sm">/{block.period}</span>}
      </div>
      <ul className="space-y-2 text-sm text-start">
        {block.features.map((f) => (
          <li key={f.id} className="flex items-center gap-2">
            {f.included ? <Check className="w-4 h-4 text-green-500 shrink-0" /> : <X className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
            <span className={cn(!f.included && 'text-muted-foreground line-through')}>{f.text}</span>
          </li>
        ))}
      </ul>
      {block.buttonText && (
        <a href={block.buttonUrl || '#'} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center justify-center w-full h-10 rounded-lg font-medium transition-colors', block.highlighted ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}>
          {block.buttonText}
        </a>
      )}
    </CardContent>
  </Card>
);

export const RenderTestimonial = ({ block }: { block: TestimonialBlock }) => (
  <Card className="card-hover border-border/50 bg-card/50 backdrop-blur-sm">
    <CardContent className="p-6 space-y-4">
      {block.rating && block.rating > 0 && (
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn('w-4 h-4', i < block.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30')} />
          ))}
        </div>
      )}
      <p className="text-foreground/80 italic leading-relaxed">"{block.text}"</p>
      <div className="flex items-center gap-3">
        {block.avatar ? (
          <img src={block.avatar} alt={block.author} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {block.author.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-sm">{block.author}</p>
          {block.role && <p className="text-xs text-muted-foreground">{block.role}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const RenderKanban = ({ block }: { block: KanbanBlock }) => (
  <div className="space-y-3">
    {block.title && <h3 className="font-semibold text-lg">{block.title}</h3>}
    <div className={cn('grid gap-3', block.columns.length <= 3 ? `grid-cols-${block.columns.length}` : 'grid-cols-2 md:grid-cols-4')}>
      {block.columns.map((col) => (
        <div key={col.id} className="rounded-lg border border-border bg-muted/20 overflow-hidden">
          <div className="px-3 py-2 bg-muted/50 border-b border-border font-semibold text-sm">{col.title}</div>
          <div className="p-2 space-y-1.5">
            {col.items.filter(Boolean).map((item, i) => (
              <div key={i} className="bg-background rounded-md border border-border px-3 py-2 text-sm shadow-sm">{item}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
