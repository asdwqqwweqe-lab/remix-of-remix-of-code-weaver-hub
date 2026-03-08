import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GitCompare, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PostVersion } from '@/types/blog';

interface VersionDiffViewProps {
  postId: string;
}

function diffLines(oldText: string, newText: string) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: { type: 'same' | 'added' | 'removed'; text: string }[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === newLine) {
      result.push({ type: 'same', text: oldLine || '' });
    } else {
      if (oldLine !== undefined) result.push({ type: 'removed', text: oldLine });
      if (newLine !== undefined) result.push({ type: 'added', text: newLine });
    }
  }
  return result;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

export default function VersionDiffView({ postId }: VersionDiffViewProps) {
  const { language } = useLanguage();
  const { getPostVersions, getPostById } = useBlogStore();
  const [open, setOpen] = useState(false);
  const [leftVersionId, setLeftVersionId] = useState<string>('');
  const [rightVersionId, setRightVersionId] = useState<string>('');

  const versions = getPostVersions(postId);
  const post = getPostById(postId);

  const currentAsVersion = post ? {
    id: 'current',
    versionNumber: versions.length + 1,
    titleSnapshot: post.title,
    summarySnapshot: post.summary,
    contentSnapshot: post.content,
  } : null;

  const allVersions = [
    ...(currentAsVersion ? [{ ...currentAsVersion, label: language === 'ar' ? 'الحالي' : 'Current' }] : []),
    ...versions.map(v => ({ ...v, label: language === 'ar' ? `إصدار ${v.versionNumber}` : `v${v.versionNumber}` })),
  ];

  const leftVersion = allVersions.find(v => v.id === leftVersionId);
  const rightVersion = allVersions.find(v => v.id === rightVersionId);

  const diff = useMemo(() => {
    if (!leftVersion || !rightVersion) return null;
    const leftContent = stripHtml(leftVersion.contentSnapshot);
    const rightContent = stripHtml(rightVersion.contentSnapshot);
    return diffLines(leftContent, rightContent);
  }, [leftVersion, rightVersion]);

  if (versions.length < 1) return null;

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(true)}>
        <GitCompare className="w-4 h-4" />
        {language === 'ar' ? 'مقارنة' : 'Compare'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              {language === 'ar' ? 'مقارنة الإصدارات' : 'Compare Versions'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4 py-2">
            <Select value={leftVersionId} onValueChange={setLeftVersionId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'ar' ? 'الإصدار الأول' : 'First version'} />
              </SelectTrigger>
              <SelectContent>
                {allVersions.map(v => (
                  <SelectItem key={v.id} value={v.id} disabled={v.id === rightVersionId}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowLeftRight className="w-5 h-5 text-muted-foreground shrink-0" />
            <Select value={rightVersionId} onValueChange={setRightVersionId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'ar' ? 'الإصدار الثاني' : 'Second version'} />
              </SelectTrigger>
              <SelectContent>
                {allVersions.map(v => (
                  <SelectItem key={v.id} value={v.id} disabled={v.id === leftVersionId}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title comparison */}
          {leftVersion && rightVersion && leftVersion.titleSnapshot !== rightVersion.titleSnapshot && (
            <div className="flex gap-4 text-sm border rounded-lg p-3">
              <div className="flex-1">
                <span className="text-muted-foreground text-xs">{language === 'ar' ? 'العنوان القديم' : 'Old Title'}</span>
                <p className="font-medium text-destructive line-through">{leftVersion.titleSnapshot}</p>
              </div>
              <div className="flex-1">
                <span className="text-muted-foreground text-xs">{language === 'ar' ? 'العنوان الجديد' : 'New Title'}</span>
                <p className="font-medium text-chart-2">{rightVersion.titleSnapshot}</p>
              </div>
            </div>
          )}

          {/* Diff view */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {!diff ? (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'ar' ? 'اختر إصدارين للمقارنة' : 'Select two versions to compare'}
              </div>
            ) : (
              <div className="font-mono text-sm">
                {diff.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      "px-4 py-1 border-b border-border/20",
                      line.type === 'added' && 'bg-chart-2/10 text-chart-2',
                      line.type === 'removed' && 'bg-destructive/10 text-destructive line-through',
                      line.type === 'same' && 'text-muted-foreground'
                    )}
                  >
                    <span className="inline-block w-6 text-muted-foreground/50 me-2">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    {line.text || '\u00A0'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
