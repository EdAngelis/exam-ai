"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { createUser } from "../../service/user.service";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Form from "@/components/elements/form/form";
import Label from "@/components/elements/label/label";
import Input from "@/components/elements/input/input";
import ErrorToast from "@/components/elements/toast/error";
import { Button } from "@/components";
import Link from "next/link";
import Loader from "@/components/elements/loader/loader";

export default function Register() {

  const router = useRouter();
  const [error, setError] = React.useState<string>('');
  const [isLoading, setisLoading] = React.useState<boolean>(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters") // Add minimum length validation
      .required("Password is required"),
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
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: any) => {

    setError("");
    setisLoading(true);

    try {
      const result = await createUser({
        email: data.email,
        password: data.password,
        name: data.email.split("@")[0],
      });

      if (result.error || !result.user) {
        setError(result.error || "Registration failed. Please try again.");
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error) {
      setError("Registration failed. Please try again.");
    }

    setisLoading(false);

  };

  return (
    <main>
      <div className={styles.page}>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <h2 className={styles.title}>Crie uma conta</h2>

          <div className={styles.slot}>
            <Label text="E-mail" />
            <Input register={register} name="email" type="email" />
            {errors.email && <ErrorToast message={errors.email?.message} />}
          </div>

          <div className={styles.slot}>
            <Label text="Senha" />
            <Input register={register} name="password" type="password" />
            {errors.password && <ErrorToast message={errors.password?.message} />}
          </div>

          <div className={styles.slot}>
            <Label text="Confirmar senha" />
            <Input register={register} name="confirmPassword" type="password" />
            {errors.confirmPassword && <ErrorToast message={errors.confirmPassword?.message} />}
          </div>

          <div style={{ textAlign: 'center' }}>
            {error && <ErrorToast message={error} />}
            {isLoading && <Loader />}
          </div>

          <div className={styles.buttonList}>
            <Button type="submit" size="full">
              Registrar
            </Button>
          </div>

          <div className={styles.signin}>
            <Link href="/">Já possui uma conta? <strong>Conectar</strong></Link>
          </div>
        </Form>
      </div>
    </main>
  );
}
