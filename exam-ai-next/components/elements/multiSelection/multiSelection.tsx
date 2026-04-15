import React, { useState } from 'react';
import styles from './multiSelection.module.css';

interface Option {
  label: string;
  value: string;
}

interface MultiSelectionProps {
  options: Option[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelection: React.FC<MultiSelectionProps> = ({ options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((val) => val !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className={styles.multiSelection}>
      <div className={styles.dropdownHeader} onClick={handleToggle}>
        {selectedValues.length > 0 ? selectedValues.join(', ') : 'Select...'}
      </div>
      {isOpen && (
        <div className={styles.dropdownList}>
          {options.map((option) => (
            <div key={option.value} className={styles.dropdownItem} onClick={() => handleSelect(option.value)}>
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleSelect(option.value)}
              />
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelection;
