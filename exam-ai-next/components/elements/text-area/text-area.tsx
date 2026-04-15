import React, { ChangeEvent } from "react";
import styles from "./text-area.module.css";

interface TextAreaProps {
  label?: string;
  name?: string;
  value?: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 5,
}) => {
  return (
    <div className={styles.textAreaContainer}>
      <label className={styles.textAreaLabel}>{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className={styles.textArea}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
};

export default TextArea;
