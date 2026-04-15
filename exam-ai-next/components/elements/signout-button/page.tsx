"use client";
import styles from "./page.module.css";
import { useSession, signOut } from "next-auth/react";

export default function GoogleSignIn() {
  const { data: session, status } = useSession();

  if (session) {
    return (
      <>
        <span>{session.user?.email || ""}</span>
        <button className={styles.button} onClick={() => signOut()}>
          Sign out
        </button>
      </>
    );
  }
}
