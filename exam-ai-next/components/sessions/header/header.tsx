"use client";
import React, { useEffect } from "react";
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
      <LogoutButton />
    </header>
  );
};

export default Header;
