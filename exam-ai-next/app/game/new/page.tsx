"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../../components/sessions/header/header";
import Form from "@/components/elements/form/form";
import Label from "@/components/elements/label/label";
import Input from "@/components/elements/input/input";
import ErrorToast from "@/components/elements/toast/error";
import Loader from "@/components/elements/loader/loader";
import { Button, Radios } from "@/components";
import { createGame } from "@/service/game.service";
import styles from "./page.module.css";

interface FormValues {
  method: "email" | "code";
  inviteeEmail?: string;
  inviteeCode?: string;
}

const validationSchema = Yup.object().shape({
  method: Yup.string().oneOf(["email", "code"]).required(),
  inviteeEmail: Yup.string().when("method", {
    is: "email",
    then: (schema) =>
      schema
        .email("E-mail inválido")
        .required("Informe o e-mail do oponente"),
    otherwise: (schema) => schema.notRequired(),
  }),
  inviteeCode: Yup.string().when("method", {
    is: "code",
    then: (schema) =>
      schema
        .matches(/^\d{6}$/, "Informe um código de 6 dígitos")
        .required("Informe o código do oponente"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export default function NewGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams?.get("examId") || "";

  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      method: "email",
      inviteeEmail: "",
      inviteeCode: "",
    },
  });

  const method = watch("method");

  const onSubmit = async (data: FormValues) => {
    setError("");

    if (!examId) {
      setError("Exame não encontrado. Volte e tente novamente.");
      return;
    }

    setIsLoading(true);
    try {
      const game = await createGame({
        examId,
        inviteeEmail: data.method === "email" ? data.inviteeEmail : undefined,
        inviteeCode: data.method === "code" ? data.inviteeCode : undefined,
      });
      router.replace(`/game/lobby?gameId=${game._id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar o jogo. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className={styles.page}>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <h2 className={styles.title}>Convidar um oponente</h2>
          <p className={styles.subtitle}>
            Escolha exatamente uma forma de convidar o outro jogador.
          </p>

          <Radios
            label="Convidar por:"
            name="method"
            options={[
              { label: "E-mail", value: "email" },
              { label: "Código de 6 dígitos", value: "code" },
            ]}
            selectedValue={method}
            onChange={(e) =>
              setValue("method", e.target.value as "email" | "code", {
                shouldValidate: true,
              })
            }
          />

          {method === "email" ? (
            <div className={styles.slot}>
              <Label text="E-mail do oponente" />
              <Input register={register} name="inviteeEmail" type="email" />
              {errors.inviteeEmail && (
                <ErrorToast message={errors.inviteeEmail?.message} />
              )}
            </div>
          ) : (
            <div className={styles.slot}>
              <Label text="Código de 6 dígitos do oponente" />
              <Input register={register} name="inviteeCode" type="text" />
              {errors.inviteeCode && (
                <ErrorToast message={errors.inviteeCode?.message} />
              )}
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            {error && <ErrorToast message={error} />}
            {isLoading && <Loader />}
          </div>

          <div className={styles.actions}>
            <Button type="button" onClick={() => router.back()} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              Enviar convite
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
