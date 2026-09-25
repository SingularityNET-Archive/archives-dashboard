// components/filters/EffectFilter.tsx
import React from 'react';
import type { FacetCount } from '../../types/meetings';
import { formatEffectType } from '../../utils/stringFormatting';
import styles from '../../styles/WorkgroupFilter.module.css';

interface EffectFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: FacetCount[];
}

const EffectFilter = ({ value, onChange, options }: EffectFilterProps) => {
  return (
    <div className={styles.filterContainer}>
      <label
        htmlFor="effect"
        className={styles.filterLabel}
      >
        Effect
      </label>
      <select
        id="effect"
        className={styles.filterSelect}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All Effects</option>
        {options.map((effect) => (
          <option key={effect.value} value={effect.value}>
            {formatEffectType(effect.value)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default EffectFilter;
