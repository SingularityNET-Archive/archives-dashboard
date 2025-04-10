// components/filters/DateFilter.tsx
import styles from '../../styles/Filters.module.css';

interface DateFilterProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export default function DateFilter({ value, onChange }: DateFilterProps) {
  return (
    <div className={styles.filterContainer}>
      <label htmlFor="dateFilter" className={styles.filterLabel}>
        Date
      </label>
      <input
        id="dateFilter"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.dateInput}
      />
    </div>
  );
}