import React from 'react';
import styles from './button.module.css';

interface ButtonProps {
  onClick?: () => void;
  type: "submit" | "button" | "reset";
  size?: "default" | "full";
  children: React.ReactNode;
  disabled?: boolean; // Add disabled prop
}

const Button: React.FC<ButtonProps> = ({ onClick, type, size = 'default', children, disabled }) => {

  const classList = `${styles.button} ${styles[size]}`

  return (
    <button className={classList} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
