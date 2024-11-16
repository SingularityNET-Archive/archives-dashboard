// components/common/HighlightedText.tsx
import React from 'react';
import styles from '../../styles/HighlightedText.module.css';

interface HighlightedTextProps {
  text: string;
  searchTerm: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, searchTerm }) => {
  if (!text || !searchTerm) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));

  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark key={index} className={styles.highlight}>{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default HighlightedText;