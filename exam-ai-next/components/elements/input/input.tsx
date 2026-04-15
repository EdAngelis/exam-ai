import React, { useState } from "react";
import styles from "./input.module.css";
import { Eye, EyeClosed } from "lucide-react";

interface InputProps {
  register: any;
  name: string;
  type: string;
}

const Input: React.FC<InputProps> = ({ register, name, type }) => {

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = showPassword ? "text" : type;

  return (
    <div className={styles.inputContainer}>
      <input
        name
        type={inputType}
        className={styles.input}
        {...register(name)}
      />
      {type === "password" && (
        <button
          type="button"
          title="Mudar visibilidade da senha"
          className={styles.toggleButton}
          onClick={togglePasswordVisibility}
        >
          {showPassword ? <EyeClosed /> : <Eye />}
        </button>
      )}
    </div>
  );
}

export default Input;
