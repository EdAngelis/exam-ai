"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Table, Button } from "../../components";
import { getUser } from "@/service/user.service";
import { insertStudentsExams } from "@/service/exams.service";
import {
  loadAssignExamDraft,
  clearAssignExamDraft,
} from "@/utils/assign_exam_draft";
import { Exam, User } from "@/models";
import style from "./page.module.css";
import Header from "../../components/sessions/header/header";
import ErrorToast from "../../components/elements/toast/error";
import SuccessToast from "../../components/elements/toast/success";

export default function AssignExamPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userEmail = useRef<string>("");
  const [exam, setExam] = useState<Exam | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const draft = loadAssignExamDraft();
    if (!draft) {
      router.push("/home");
      return;
    }
    setExam(draft);
  }, [router]);

  useEffect(() => {
    if (session) {
      userEmail.current = (session.user?.email as string) || "";
    }
    if (userEmail.current) {
      fetchUser(userEmail.current);
    }
  }, [session]);

  const fetchUser = async (email: string) => {
    try {
      const userData = await getUser(email);
      setUser(userData);
    } catch (err) {
      console.error(err);
    }
  };

  const studentsList = user?.students ?? [];

  const filteredStudents = studentsList.filter((student) =>
    student.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;

  const toggleStudent = (rowIndex: number) => {
    const email = currentStudents[rowIndex];
    if (!email) return;
    setSelected((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const handleConfirm = async () => {
    setError(undefined);
    setSuccess(undefined);
    if (!exam) return;
    if (selected.length === 0) {
      setError("Selecione ao menos um estudante.");
      return;
    }
    setSubmitting(true);
    try {
      const resp = await insertStudentsExams(selected, exam);
      setSuccess(resp.message || "Exame atribuído com sucesso.");
      clearAssignExamDraft();
      router.push("/home");
    } catch (err) {
      setError("Não foi possível atribuir o exame aos estudantes.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    clearAssignExamDraft();
    router.push("/home");
  };

  return (
    <div>
      <Header />
      <div className={style.page}>
        <h1 className={style.title}>Selecionar estudantes para o exame</h1>

        <div className={style.searchContainer}>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={style.searchBox}
          />
        </div>

        <Table
          head={["Email"]}
          body={currentStudents.map((student) => [student])}
          selectable={true}
          selectedRows={currentStudents.map((student) =>
            selected.includes(student)
          )}
          onToggleRow={toggleStudent}
        />

        <div className={style.pagination}>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <div className={style.buttonsPagination}>
            <Button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              type="button"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>

        <p>{selected.length} estudante(s) selecionado(s)</p>

        {error && <ErrorToast message={error} />}
        {success && <SuccessToast message={success} />}

        <div className={style.actions}>
          <Button type="button" onClick={handleCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={submitting}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
