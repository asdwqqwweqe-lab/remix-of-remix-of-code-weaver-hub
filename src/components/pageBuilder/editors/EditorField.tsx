import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function Field({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
