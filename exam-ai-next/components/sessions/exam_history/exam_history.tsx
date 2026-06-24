import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getExams } from "../../../service/exams.service";
import Exam from "../../../models/exam";
import getScores from "../../../utils/calc_score";
import styles from "./exam_history.module.css";
import { Button } from "../..";

const ExamHistory = ({ userEmail }: { userEmail: string }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [currentExams, setCurrentExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  let totalPages = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const fetchExams = async () => {
      const examsList = await getExams(userEmail);
      totalPages.current = Math.ceil(examsList.length / itemsPerPage);
      setExams(examsList);
    };

    if (userEmail) fetchExams();
  }, [userEmail]);

  const handleViewExam = (examId: string) => {
    router.push(`/exam?examId=${examId}`);
  };

  useEffect(() => {
    handlerPagination();
  }, [currentPage, searchTerm, exams]);

  const handleNextPage = () => {
    console.log(totalPages.current);
    if (currentPage < totalPages.current) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handlerPagination = () => {
    try {
      const filteredExams = exams.filter(
        (exam) =>
          exam.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exam.subCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (exam.subject?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ),
      );

      const indexOfLastExam = currentPage * itemsPerPage;
      const indexOfFirstExam = indexOfLastExam - itemsPerPage;

      setCurrentExams(filteredExams.slice(indexOfFirstExam, indexOfLastExam));

      totalPages.current = Math.ceil(filteredExams.length / itemsPerPage);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.examHistory}>
      <div className={styles.searchContainer}>
        <Image
          src="/images/search.png"
          alt="Search Icon"
          width={20}
          height={20}
          className={styles.searchIcon}
        />
        <input
          type="text"
          placeholder="Buscar por categoria, subcategoria ou tópico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchBox}
        />
      </div>

      <div className={styles.examGrid}>
        {currentExams.map((exam) => (
          <div key={exam._id} className={styles.examCard}>
            <div className={styles.cardContent}>
              <div className={styles.cardRow}>
                <div className={styles.cardText}>
                  <p>Criada em 00/00/0000 ás 00:00:00 </p>
                  <h2>{exam.category}</h2>
                  <h3>
                    {exam.subject}- {exam.subCategory}
                  </h3>
                </div>
              </div>
              <div className={styles.cardButton}>
                <div className={styles.scores}>
                  {getScores(exam)
                    .slice(-3)
                    .map((score, index) => (
                      <div
                        key={index}
                        className={
                          score >= 70 ? styles.scoreHigh : styles.scoreLow
                        }
                      >
                        {Math.round(score)}%
                      </div>
                    ))}
                </div>
                <Button
                  type="button"
                  onClick={() => handleViewExam(exam._id as string)}
                >
                  {exam.answers ? "Refazer" : "Iniciar Exame"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.pagination}>
        <span>
          <strong>
            Página {currentPage} de {totalPages.current}
          </strong>
        </span>
        <div className={styles.buttonsPagination}>
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
            disabled={currentPage === totalPages.current}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExamHistory;
