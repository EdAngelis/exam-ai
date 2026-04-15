"use client";
import { Button } from "@/components";
import Loader from "@/components/elements/loader/loader";
import ErrorToast from "@/components/elements/toast/error";
import { verifyEmail } from "@/service/auth.service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import styles from "./page.module.css";

export default function VerifyEmail() {
  const router = useRouter();
  const length = 6;
  const [code, setCode] = useState(Array(length).fill(""));

  const [error, setError] = React.useState<string>("");
  const [isLoading, setisLoading] = React.useState<boolean>(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");

    setisLoading(true);
    setError("");

    if (fullCode.length === length) {
      try {
        const response = await verifyEmail(fullCode);
        console.log(response);
        if (response.message === "Email validated successfully") {
          alert("Email verified!");
          router.push("/");
        } else {
          setError("Failed to verify email.");
        }
      } catch (error) {
        console.error("Error verifying email:", error);
      }
    } else {
      setError("Please enter a 6-digit code.");
      // alert("Please enter a 6-digit code.");
    }

    setisLoading(false);
  };

  return (
    <main className={styles.main}>
      <div className={styles.page}>
        <div className={styles.container}>
          <h1>Verifique seu e-mail</h1>
          <div className={styles.codeContainer}>
            {code.map((num, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                value={num}
                maxLength={1}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={styles.code}
              />
            ))}
          </div>
          <Button type="button" onClick={handleSubmit} size="full">
            Verificar
          </Button>
          <div style={{ textAlign: "center" }}>
            {error && <ErrorToast message={error} />}
            {isLoading && <Loader />}
          </div>

          <div className={styles.resend}>
            Não recebeu o códgio?{" "}
            <Link href="/verify-email">
              <strong>Reenviar Código</strong>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
