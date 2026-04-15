"use client";
import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import styles from "./dropdown_input.module.css";

interface DropdownInputProps {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (name: string, value: string) => void;
  error?: string;
}

const DropdownInput: React.FC<DropdownInputProps> = ({
  label,
  name,
  value,
  options = [],
  onChange,
  error,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize function to compare text
  const normalize = (text: string) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Filter options based on input value
  const filteredOptions = options.filter((option) =>
    normalize(option.toLowerCase()).startsWith(normalize(value.toLowerCase()))
  );

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <label>{label}</label>
      <input
        name={name}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(name, e.target.value)
        }
        className={styles.input}
        placeholder={`Digite ${label.toLowerCase()}`}
        onClick={() => setShowDropdown(!showDropdown)}
      />
      {showDropdown && filteredOptions.length > 0 && (
        <div className={styles.dropdown}>
          {filteredOptions.map((option) => (
            <div
              key={option}
              className={`${styles.option} ${
                normalize(option.toLowerCase()) ===
                normalize(value.toLowerCase())
                  ? styles.selectedOption
                  : ""
              }`}
              onClick={() => onChange(name, option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

export default DropdownInput;
