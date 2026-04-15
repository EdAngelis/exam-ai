import React from "react";
import styles from "./footer.module.css";
import { Mail, Phone } from "lucide-react";
import { BsWhatsapp } from "react-icons/bs";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>

        <div className={styles.contact}>
          <a href="mailto:ed4ngelis@hotmail.com">
            <Mail size={20} /> <span>ed4ngelis@hotmail.com </span>
          </a>
          <a href="tel:+5511948589951">
            <Phone size={20} /> <span>(11) 9 4858-9951</span>
          </a>
          <a href="https://wa.me/5511948589951"><BsWhatsapp size={20} /> <span>(11) 9 4858-9951</span></a>
        </div>

        <p>Todos os direitos reservados &copy; {new Date().getFullYear()}</p>

      </div>
    </footer>
  );
};

export default Footer;
