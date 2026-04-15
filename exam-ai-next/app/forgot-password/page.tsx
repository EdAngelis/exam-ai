"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { sendResetPasswordToken } from "@/service/auth.service";
import { Button } from "@/components";
import Form from "@/components/elements/form/form";
import Input from "@/components/elements/input/input";
import Loader from "@/components/elements/loader/loader";
import ErrorToast from "@/components/elements/toast/error";
import SuccessToast from "@/components/elements/toast/success";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { object } from "yup";
import styles from "./page.module.css";

export default function ForgotPassword() {
  const router = useRouter();
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");
  const [isLoading, setisLoading] = React.useState<boolean>(false);

  const validationSchema = object().shape({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: { email: string }) => {
    setisLoading(true);
    setError("");
    try {
      const resp = await sendResetPasswordToken(data.email);
      if (resp.status != 200) {
        setError("Erro ao enviar o e-mail. Tente novamente.");
        setSuccess("");
        return;
      }
      setSuccess("E-mail enviado com sucesso!");
      router.push("/");
    } catch (error) {
      setError("Erro ao enviar o e-mail. Tente novamente.");
      setSuccess("");
    }
    setisLoading(false);
  };

  return (
    <main className={styles.main}>
      <div className={styles.page}>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <h1 className={styles.title}>Esqueceu a senha?</h1>

          <div className={styles.instructions}>
            <p>Insira o seu e-mail cadastrado abaixo.</p>
            <p>Você receberá um link para redefinir a senha.</p>
          </div>

          <div className={styles.slot}>
            <Input register={register} name={"email"} type={"email"} />
            {errors.email && <ErrorToast message={errors.email?.message} />}
            {error && <ErrorToast message={error} />}
            {success && <SuccessToast message={success} />}
            {isLoading && <Loader />}
          </div>
          <Button type="submit" size="full">
            Enviar e-mail
          </Button>
        </Form>
      </div>
    </main>
  );
}
