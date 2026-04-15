import React, { useEffect } from "react";
import styles from "./radio.module.css";

interface RadioOption {
  label: string;
  value: string;
}

interface RadioProps {
  label?: string;
  name: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Radio: React.FC<RadioProps> = ({
  label,
  name,
  options,
  selectedValue,
  onChange,
}) => {
  useEffect(() => {
    if (!selectedValue && options.length > 0) {
      onChange({
        target: { value: options[0].value },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [selectedValue, options, onChange]);

  return (
    <div className={styles.wrapper}>
      <span>{label}</span>
      {options.map((option) => (
        <label key={option.value} className={styles.radioLabel}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={onChange}
            className={styles.radioInput}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
};

export default Radio;
