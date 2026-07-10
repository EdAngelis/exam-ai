"use client";
import React, { useRef } from "react";
import { NextPage } from "next";
import { useSession } from "next-auth/react";
import Header from "../../components/sessions/header/header";
import GameHistory from "../../components/sessions/game_history/game_history";
import style from "./page.module.css";

const Page: NextPage = () => {
  const userEmail = useRef<string>("");
  const { data: session } = useSession();

  if (session) {
    userEmail.current = (session.user?.email as string) || "";
  }

  return (
    <div className={style.container}>
      <Header />
      <div className={style.gameHistory}>
        <GameHistory userEmail={userEmail.current} />
      </div>
    </div>
  );
};

export default Page;
