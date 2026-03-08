import { Block } from '@/types/pageBuilder';
import { RenderText, RenderIconCard, RenderTable, RenderCard, RenderDivider, RenderImage, RenderList, RenderSpacer, RenderQuote, RenderAlert } from './renderers/BasicRenderers';
import { RenderVideo, RenderButton, RenderGallery, RenderEmbed } from './renderers/MediaRenderers';
import { RenderAccordion, RenderTabs, RenderCode, RenderHero, RenderProgress, RenderStats, RenderTimeline, RenderPricing, RenderTestimonial, RenderKanban } from './renderers/AdvancedRenderers';
import { RenderTerminal, RenderApi, RenderFileTree, RenderDiff, RenderChecklist, RenderCitation, RenderMath } from './renderers/DeveloperRenderers';

interface BlockRendererProps {
  block: Block;
  isPreview?: boolean;
}

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
  hero: (b) => <RenderHero block={b} />,
  gallery: (b) => <RenderGallery block={b} />,
  progress: (b) => <RenderProgress block={b} />,
  stats: (b) => <RenderStats block={b} />,
  embed: (b) => <RenderEmbed block={b} />,
  timeline: (b) => <RenderTimeline block={b} />,
  pricing: (b) => <RenderPricing block={b} />,
  testimonial: (b) => <RenderTestimonial block={b} />,
  terminal: (b) => <RenderTerminal block={b} />,
  api: (b) => <RenderApi block={b} />,
  'file-tree': (b) => <RenderFileTree block={b} />,
  diff: (b) => <RenderDiff block={b} />,
  checklist: (b) => <RenderChecklist block={b} />,
  citation: (b) => <RenderCitation block={b} />,
  math: (b) => <RenderMath block={b} />,
  kanban: (b) => <RenderKanban block={b} />,
};

export default function BlockRenderer({ block, isPreview }: BlockRendererProps) {
  const render = renderers[block.type];
  if (!render) return null;
  return <div className="animate-fade-in">{render(block)}</div>;
}
