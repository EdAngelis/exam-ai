import React, { ReactNode } from 'react';
import styles from "./form.module.css";

interface FormProps {
  children: ReactNode;
  [key: string]: any;
}

const Form: React.FC<FormProps> = ({ children, ...props }) => {
  return (
    <form {...props} className={styles.form}>
      {children}
    </form>
  );
}

export default Form;
