"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import GoogleSignIn from "../../elements/google-signin-button/page";
import * as Yup from "yup";
import { signIn as credencialSignIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Input from "@/components/elements/input/input";
import Label from "@/components/elements/label/label";
import Button from "@/components/elements/button/button";
import Link from "next/link";
import ErrorToast from "@/components/elements/toast/error";
import Loader from "@/components/elements/loader/loader";
import Form from "@/components/elements/form/form";

const SignIn = () => {
  const [error, setError] = React.useState<string>("");
  const [isLoading, setisLoading] = React.useState<boolean>(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .required("Password is required")
      .min(6, "Password has to be at least 6 characters long."),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: any) => {
    console.log("data", data);

    setisLoading(true);

    try {
      const result = await credencialSignIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        console.error("Sign In failed", result.error);
        setError(`Credenciais Invalidas ${result.error}`);
      } else {
        console.log("Sign In successful");
      }
    } catch (error) {
      console.error("Sign In failed", error);
    }

    setisLoading(false);
  };

  return (
    <>
      <div className={styles.page}>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <h2 className={styles.title}>Bem vindo de volta!</h2>
          <div className={styles.slot}>
            <Label text="E-mail" />
            <Input register={register} name="email" type="email" />
            {errors.email && <ErrorToast message={errors.email?.message} />}
          </div>
          <div className={styles.slot}>
            <Label text="Senha" />
            <Input register={register} name="password" type="password" />
            {errors.password && (
              <ErrorToast message={errors.password?.message} />
            )}
          </div>
          <div className={styles.slot}>
            <Link href="forgot-password" className={styles.forgot}>
              Esqueceu a senha?
            </Link>
          </div>
          <div className={styles.buttonList}>
            <Button type="submit" size="full">
              Conectar
            </Button>
          </div>

          <div style={{ textAlign: "center" }}>
            {error && <ErrorToast message={error} />}
            {isLoading && <Loader />}
          </div>

          <div className={styles.register}>
            <Link href="/signup">
              É sua primeira vez? <strong>Registrar</strong>
            </Link>
          </div>
          <div className={styles.line}>
            <span>ou</span>
          </div>
          <GoogleSignIn />
        </Form>
      </div>
    </>
  );
};

export default SignIn;
