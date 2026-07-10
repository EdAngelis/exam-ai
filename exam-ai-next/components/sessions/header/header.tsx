"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./header.module.css";
import { useSession } from "next-auth/react";
import LogoutButton from "../../elements/signout-button/page";

const Header = () => {
  const { status } = useSession();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      return router.push("/");
    }
    if (status === "authenticated" && pathname === "/") {
      return router.push("/home");
    }
  }, [status, router, pathname]);

  const handleTitleClick = () => {
    return router.push("/home");
  };

  return (
    <header className={styles.header}>
      <h1 className={styles.title} onClick={handleTitleClick}>
        Exam-AI
      </h1>
      <div className={styles.rightSection}>
        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <Link href="/game">Multiplayer</Link>
          </li>
        </ul>
        <LogoutButton />
      </div>
    </header>
  );
};

export default Header;
