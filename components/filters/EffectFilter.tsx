// components/filters/EffectFilter.tsx
import React from 'react';
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { formatEffectType } from '../../utils/stringFormatting';
import styles from '../../styles/WorkgroupFilter.module.css';

interface EffectFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const EffectFilter = ({ value, onChange }: EffectFilterProps) => {
  const effectTypes = [
    'affectsOnlyThisWorkgroup',
    'mayAffectOtherPeople'
  ];

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
        {effectTypes.map((effect) => (
          <option key={effect} value={effect}>
            {formatEffectType(effect)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default EffectFilter;