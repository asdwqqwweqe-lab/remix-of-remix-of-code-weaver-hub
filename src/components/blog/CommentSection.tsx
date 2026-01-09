import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlogStore } from '@/store/blogStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AdvancedCommentEditor from './AdvancedCommentEditor';

interface CommentSectionProps {
  postId: string;
}

// Simple markdown renderer for comments
const renderMarkdown = (text: string) => {
  return text
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-2 rounded my-2 overflow-x-auto text-sm"><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br />');
};

const CommentSection = ({ postId }: CommentSectionProps) => {
  const { t } = useTranslation();
  const { addComment, getCommentsByPost } = useBlogStore();
  const postComments = getCommentsByPost(postId).filter(c => c.status === 'approved');

  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error(t('comments.requiredFields'));
      return;
    }

    addComment({
      postId,
      authorName: t('comments.anonymous'),
      content: content.trim(),
      status: 'approved',
    });

    setContent('');
    toast.success(t('comments.submittedDirect'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {t('comments.title')} ({postComments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        <AdvancedCommentEditor
          value={content}
          onChange={setContent}
          onSubmit={handleSubmit}
          placeholder={t('comments.yourComment')}
        />

        {/* Comments List */}
        {postComments.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            {postComments.map((comment) => (
              <div key={comment.id} className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{comment.authorName}</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(comment.createdAt), 'PPp')}
                  </span>
                </div>
                <div 
                  className="text-sm prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommentSection;
