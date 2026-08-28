import { formatChips } from '@/lib/format';

interface ChipTokenProps {
  amount: number;
  small?: boolean;
  label?: string;
}

export function ChipToken({ amount, small = false, label }: ChipTokenProps) {
  const sizeClasses = small ? 'h-9 w-9 text-[10px]' : 'h-12 w-12 text-xs';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`${sizeClasses} flex items-center justify-center rounded-full border-4 border-dashed border-amber-200/70 bg-gradient-to-br from-amber-500 to-amber-700 font-bold text-white shadow-lg ring-1 ring-black/30`}
      >
        {formatChips(amount)}
      </div>
      {label && <span className="text-[9px] text-slate-400">{label}</span>}
    </div>
  );
}
