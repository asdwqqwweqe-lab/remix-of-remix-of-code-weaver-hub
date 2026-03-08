import { VideoBlock, ButtonBlock, EmbedBlock, GalleryBlock } from '@/types/pageBuilder';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

export const RenderVideo = ({ block }: { block: VideoBlock }) => {
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

export const RenderButton = ({ block }: { block: ButtonBlock }) => {
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

export const RenderGallery = ({ block }: { block: GalleryBlock }) => {
  const colClasses = { 2: 'grid-cols-2', 3: 'grid-cols-2 md:grid-cols-3', 4: 'grid-cols-2 md:grid-cols-4' };
  return (
    <div className={cn('grid gap-3', colClasses[block.columns])}>
      {block.items.map((item) => (
        <figure key={item.id} className="group relative overflow-hidden rounded-lg border border-border">
          <img src={item.src} alt={item.alt} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          {item.caption && (
            <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-3 text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {item.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
};

export const RenderEmbed = ({ block }: { block: EmbedBlock }) => (
  <div className="space-y-2">
    {block.title && <h4 className="font-medium">{block.title}</h4>}
    <div className="rounded-lg overflow-hidden border border-border" style={{ height: block.height || 400 }}>
      <iframe src={block.url} className="w-full h-full" title={block.title || 'Embedded content'} sandbox="allow-scripts allow-same-origin allow-popups" />
    </div>
  </div>
);
