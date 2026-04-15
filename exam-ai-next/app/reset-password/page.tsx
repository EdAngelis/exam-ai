"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { resetPassword } from "@/service/auth.service";
import Button from "@/components/elements/button/button";
import Form from "@/components/elements/form/form";
import Input from "@/components/elements/input/input";
import Label from "@/components/elements/label/label";
import Loader from "@/components/elements/loader/loader";
import ErrorToast from "@/components/elements/toast/error";
import SuccessToast from "@/components/elements/toast/success";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter, useSearchParams } from "next/navigation";
import * as Yup from "yup";
import styles from "./page.module.css";

const ResetPassword = () => {
  const Router = useRouter();
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const validationSchema = Yup.object().shape({
    password: Yup.string()
      .required("Password is required")
      .min(6, "Password has to be at least 6 characters long."),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), undefined], "Passwords must match")
      .required("Confirm Password is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: { password: string }) => {
    setIsLoading(true);

    try {
      if (!token) {
        setError("Token inválido.");
        setSuccess("");
        setIsLoading(false);
        return;
      }

      const response = await resetPassword(token, data.password);
      console.log(response);
      if (!response.status || response.status != 200) {
        const errorMessage =
          response?.message || "Ocorreu um erro ao redefinir a senha.";
        setError(errorMessage);
        setSuccess("");
        setIsLoading(false);
        return;
      }

      setSuccess("Senha redefinida com sucesso.");
      setError("");

      Router.push("/");
    } catch (error) {
      setError("Ocorreu um erro ao redefinir a senha.");
      setSuccess("");
    }

    setIsLoading(false);
  };

  return (
    <>
      <main>
        <div className={styles.page}>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <h2 className={styles.title}>Redefinir senha</h2>

            <div className={styles.slot + " " + styles.info}>
              <p>A senha deve conter:</p>
              <ul>
                <li>Pelo menos 6 caracteres</li>
              </ul>
            </div>

            <div className={styles.slot}>
              <Label text="Senha" />
              <Input register={register} name="password" type="password" />
              {errors.password && (
                <ErrorToast message={errors.password?.message} />
              )}
            </div>

            <div className={styles.slot}>
              <Label text="Confirme a senha" />
              <Input
                register={register}
                name="confirmPassword"
                type="password"
              />
              {errors.confirmPassword && (
                <ErrorToast message={errors.confirmPassword?.message} />
              )}
            </div>

            <div style={{ textAlign: "center" }} className={styles.slot}>
              {error && <ErrorToast message={error} />}
              {success && <SuccessToast message={success} />}
              {isLoading && <Loader />}
            </div>

            <div className={styles.buttonList}>
              <Button type="submit" size="full">
                Redefinir
              </Button>
            </div>
          </Form>
        </div>
      </main>
    </>
  );
};

export default ResetPassword;
