import { TerminalBlock, ApiBlock, FileTreeBlock, DiffBlock, ChecklistBlock, CitationBlock, MathBlock } from '@/types/pageBuilder';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { File, Folder, ChevronRight, Square, CheckSquare, ExternalLink as LinkIcon } from 'lucide-react';

export const RenderTerminal = ({ block }: { block: TerminalBlock }) => (
  <div className="rounded-lg border border-border overflow-hidden bg-card text-card-foreground dark:bg-muted/80">
    {block.title && (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/70" />
          <div className="w-3 h-3 rounded-full bg-primary/70" />
          <div className="w-3 h-3 rounded-full bg-accent/70" />
        </div>
        <span className="text-xs font-mono text-muted-foreground">{block.title}</span>
      </div>
    )}
    <div className="p-4 font-mono text-sm space-y-1">
      {block.commands.map((cmd, i) => (
        <div key={i} className="leading-relaxed">
          {cmd.startsWith(block.prompt) ? (
            <>
              <span className="text-primary">{block.prompt} </span>
              <span>{cmd.slice(block.prompt.length + 1)}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{cmd}</span>
          )}
        </div>
      ))}
    </div>
  </div>
);

export const RenderApi = ({ block }: { block: ApiBlock }) => {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400 border-green-500/30',
    POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PUT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-lg">{block.title}</h3>
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{block.baseUrl}</span>
      </div>
      {block.methods.map((m) => (
        <div key={m.id} className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30">
            <span className={cn('text-xs font-bold font-mono px-2 py-0.5 rounded border', methodColors[m.method] || '')}>{m.method}</span>
            <code className="text-sm font-mono">{m.endpoint}</code>
          </div>
          {m.description && <p className="px-4 py-2 text-sm text-muted-foreground border-t border-border/50">{m.description}</p>}
          {m.params && (
            <div className="px-4 py-2 border-t border-border/50">
              <span className="text-xs font-semibold text-muted-foreground">Params:</span>
              <pre className="text-xs font-mono mt-1 text-muted-foreground">{m.params}</pre>
            </div>
          )}
          {m.response && (
            <div className="px-4 py-2 border-t border-border/50">
              <span className="text-xs font-semibold text-muted-foreground">Response:</span>
              <pre className="text-xs font-mono mt-1 text-muted-foreground">{m.response}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const RenderFileTree = ({ block }: { block: FileTreeBlock }) => (
  <div className="rounded-lg border border-border overflow-hidden">
    {block.title && (
      <div className="px-4 py-2 bg-muted/50 border-b border-border text-sm font-semibold">{block.title}</div>
    )}
    <div className="p-3 font-mono text-sm space-y-0.5">
      {block.items.map((item) => (
        <div key={item.id} className="flex items-center gap-1.5 py-0.5 hover:bg-muted/30 rounded px-1" style={{ paddingInlineStart: `${item.indent * 1.25 + 0.25}rem` }}>
          {item.type === 'folder' ? (
            <>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <Folder className="w-4 h-4 text-yellow-500" />
            </>
          ) : (
            <File className="w-4 h-4 text-muted-foreground ms-[0.875rem]" />
          )}
          <span className={item.type === 'folder' ? 'font-semibold' : 'text-muted-foreground'}>{item.name}</span>
        </div>
      ))}
    </div>
  </div>
);

export const RenderDiff = ({ block }: { block: DiffBlock }) => (
  <div className="rounded-lg border border-border overflow-hidden">
    {(block.title || block.filename) && (
      <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center gap-2">
        {block.filename && <span className="text-xs font-mono text-muted-foreground">{block.filename}</span>}
        {block.title && <span className="text-xs text-muted-foreground">{block.title}</span>}
      </div>
    )}
    <div className="font-mono text-sm">
      {block.lines.map((line, i) => {
        const bg = line.type === 'added' ? 'bg-green-500/10 text-green-400' : line.type === 'removed' ? 'bg-red-500/10 text-red-400' : '';
        const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';
        return (
          <div key={line.id} className={cn('flex px-4 py-0.5', bg)}>
            <span className="w-8 text-end text-muted-foreground/50 select-none me-3">{i + 1}</span>
            <span className="w-4 select-none">{prefix}</span>
            <span>{line.content}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export const RenderChecklist = ({ block }: { block: ChecklistBlock }) => (
  <div className="space-y-2">
    {block.title && <h3 className="font-semibold text-lg">{block.title}</h3>}
    <div className="space-y-1.5">
      {block.items.map((item) => (
        <div key={item.id} className="flex items-center gap-2.5">
          {item.checked ? (
            <CheckSquare className="w-4.5 h-4.5 text-primary shrink-0" />
          ) : (
            <Square className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
          )}
          <span className={cn('text-sm', item.checked && 'line-through text-muted-foreground')}>{item.text}</span>
        </div>
      ))}
    </div>
  </div>
);

export const RenderCitation = ({ block }: { block: CitationBlock }) => (
  <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-1.5">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icons.BookOpen className="w-4 h-4 text-primary" />
      </div>
      <div className="space-y-1 min-w-0">
        <p className="font-semibold text-sm">{block.title}</p>
        <p className="text-sm text-muted-foreground">{block.authors} ({block.year})</p>
        <p className="text-sm italic text-muted-foreground">{block.source}</p>
        <div className="flex items-center gap-3 pt-1">
          {block.doi && <span className="text-xs font-mono text-primary">DOI: {block.doi}</span>}
          {block.url && (
            <a href={block.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Link
            </a>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const RenderMath = ({ block }: { block: MathBlock }) => (
  <div className={cn('py-4', block.displayMode && 'text-center')}>
    <div className={cn('inline-block font-mono text-lg bg-muted/30 rounded-lg border border-border', block.displayMode ? 'px-8 py-4' : 'px-3 py-1')}>
      {block.expression}
    </div>
    {block.label && <p className="text-xs text-muted-foreground mt-2 text-center">({block.label})</p>}
  </div>
);
