"use client";
import React, { useEffect, useRef, useState } from "react";
import { InputButton, Table, Button } from "../../components";
import { addStudent, getUser, removeStudent } from "@/service/user.service";
import { useSession } from "next-auth/react";
import { User } from "@/models";
import style from "./page.module.css";
import Header from "../../components/sessions/header/header";

export default function StudentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const userEmail = useRef<string>("");
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      userEmail.current = (session.user?.email as string) || "";
    }
    fetchUser(userEmail.current);
  }, [session]);

  const fetchUser = async (email: string) => {
    try {
      if (!email) return;
      const userData = await getUser(email);
      setUser(userData);
    } catch (error) {
      console.error(error);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddStudent = async (studentEmail: string) => {
    if (!isValidEmail(studentEmail)) {
      alert("Por favor, insira um email válido.");
      return;
    }

    if (userEmail.current) {
      try {
        const resp = await addStudent(userEmail.current, studentEmail);
        setUser(resp);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleRemoveStudent = async (rowIndex: number) => {
    if (userEmail.current && user?.students) {
      try {
        const studentEmail = user.students[rowIndex];
        const resp = await removeStudent(userEmail.current, studentEmail);
        setUser(resp);
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Ensure students array is not null
  const studentsList = user?.students ?? [];

  // Apply search filter
  const filteredStudents = studentsList.filter((student) =>
    student.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination logic
  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div>
      <Header />
      <div className={style.page}>
        <h1 className={style.title}>Adicionar estudante na lista</h1>
        <InputButton onClick={handleAddStudent} />
        <h1 className={style.title}>Lista de Estudantes </h1>

        {/* Search Box */}
        <div className={style.searchContainer}>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={style.searchBox}
          />
        </div>

        {/* Students Table */}
        <Table
          head={["Email"]}
          body={currentStudents.map((student) => [student])}
          deleteEnabled={true}
          onDelete={(index) => handleRemoveStudent(index + indexOfFirstStudent)}
        />

        {/* Pagination Controls */}
        <div className={style.pagination}>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <div className={style.buttonsPagination}>
            <Button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
