import { Chip, ChipGroup } from '@/components';
import type { CategoryInfo } from '@/types';

interface SourcePickerProps {
  label: string;
  categories: CategoryInfo[];
  enabled: Record<string, boolean>;
  onToggle: (id: string) => void;
}

/** One row of word-source chips, such as the modifier sources. */
export function SourcePicker({ label, categories, enabled, onToggle }: SourcePickerProps) {
  return (
    <ChipGroup label={label}>
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.label}
          pressed={!!enabled[category.id]}
          title={category.tip}
          onClick={() => onToggle(category.id)}
        />
      ))}
    </ChipGroup>
  );
}
