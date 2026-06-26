"use client";
import { Button } from "@/components";
import Loader from "@/components/elements/loader/loader";
import ErrorToast from "@/components/elements/toast/error";
import SuccessToast from "@/components/elements/toast/success";
import { resendValidationToken, verifyEmail } from "@/service/auth.service";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const RESEND_COOLDOWN = 60;

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const length = 6;
  const [code, setCode] = useState(Array(length).fill(""));

  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");
  const [isLoading, setisLoading] = React.useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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

  const handleResend = async () => {
    if (cooldown > 0) return;

    setError("");
    setSuccess("");

    if (!email) {
      setError("E-mail não encontrado. Refaça o cadastro.");
      return;
    }

    setisLoading(true);

    try {
      const response = await resendValidationToken(email);
      if (response.status && response.status !== 200) {
        setError(response.message || "Erro ao reenviar o código.");
      } else {
        setSuccess("Código reenviado. Verifique seu e-mail.");
        setCooldown(RESEND_COOLDOWN);
      }
    } catch (error) {
      console.error("Error resending code:", error);
      setError("Erro ao reenviar o código.");
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
            {success && <SuccessToast message={success} />}
            {isLoading && <Loader />}
          </div>

          <div className={styles.resend}>
            Não recebeu o códgio?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
              className={styles.resendButton}
            >
              <strong>
                {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar Código"}
              </strong>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
