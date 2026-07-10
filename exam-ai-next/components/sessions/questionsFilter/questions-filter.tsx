import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Question, Exam } from "../../../models";
import {
  getQuestions,
  getSubcategory,
  getCategory,
} from "../../../service/questions.service";
import { insertExam } from "../../../service/exams.service";
import { saveAssignExamDraft } from "../../../utils/assign_exam_draft";
import { Button } from "../../../components";

import Dropdown from "../../elements/dropdown/dropdown";
import style from "./questions-filter.module.css";

export default function QuestionsFilter({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsFiltered, setQuestionsFiltered] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("");
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [subCategory, setSubCategory] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (!userEmail) return;
    startTransition(fetchCategories);
  }, [userEmail]);

  const fetchCategories = async () => {
    try {
      const resp = await getCategory(userEmail);
      resp.unshift("Select Category");
      setCategory("Select Category");
      setCategories(resp);
    } catch (error) {
      console.log(error);
    }
  };

  const handlerCategoryChange = async (category: string) => {
    if (!category || category === "Select Category") {
      setSubCategories([]);
      setSubjects([]);
      setQuestions([]);
      setQuestionsFiltered([]);
      return;
    }
    startTransition(async () => {
      const resp = await getSubcategory(category, userEmail);
      if (Array.isArray(resp)) {
        resp.unshift("Select SubCategory");
        setSubCategory("Select SubCategory");
        setSubCategories(resp);
      } else {
        console.error("Expected an array for subcategories");
      }
    });
  };

  const handlerSubCategoryChange = async (subCategory: string) => {
    if (!subCategory || subCategory === "Select SubCategory") {
      setSubjects([]);
      setQuestions([]);
      setQuestionsFiltered([]);
      return;
    }
    startTransition(async () => {
      const resp = await getQuestions(userEmail, category, subCategory);
      if (Array.isArray(resp)) {
        const subjects = Array.from(
          new Set(
            resp.map(
              (question) =>
                (question?.subject as string) || (question.subJect as string)
            )
          )
        ); // Take distinct values
        subjects.unshift("Select Subject");
        setSubjects(subjects);
        setQuestions(resp);
        setQuestionsFiltered(resp);
      } else {
        console.error("Expected an array for questions");
      }
    });
  };

  const handlerSubjectChange = async (subject: string) => {
    if (!subject || subject === "Select Subject") return;
    const filtered = questions.filter(
      (question) => question.subject === subject
    );
    setQuestionsFiltered(filtered);
  };

  const toBuildExam = (): Exam => {
    return {
      userEmail,
      questionsId: questionsFiltered.map((question) => question._id),
      category,
      subCategory,
      subject,
    } as Exam;
  };

  const goToExam = async () => {
    if (questionsFiltered.length === 0) {
      alert(
        "Você precisa selecionar ao menos uma questão para iniciar o exame"
      );
      return;
    }
    const exam = toBuildExam();
    const resp = await insertExam(exam);
    const examId = resp.exam.insertedId;

    if (resp.message === "Exam created successfully") {
      router.push(`/exam?examId=${examId}`);
    }
  };

  const goToGenerate = () => {
    const categoryQuery = category === "Select Category" ? "" : category;
    const subCategoryQuery =
      subCategory === "Select SubCategory" ? "" : subCategory;
    const subjectQuery = subject === "Select Subject" ? "" : subject;
    router.push(
      `/generator?category=${categoryQuery}&subCategory=${subCategoryQuery}&subject=${subjectQuery}`
    );
  };

  const goToAssignExam = () => {
    if (questionsFiltered.length === 0) {
      alert("Você precisa selecionar ao menos uma questão para gerar o exame");
      return;
    }
    saveAssignExamDraft(toBuildExam());
    router.push("/assign-exam");
  };

  const goToStartGame = async () => {
    if (questionsFiltered.length === 0) {
      alert(
        "Você precisa selecionar ao menos uma questão para iniciar o jogo"
      );
      return;
    }
    const exam = toBuildExam();
    const resp = await insertExam(exam);
    const examId = resp.exam.insertedId;

    if (resp.message === "Exam created successfully") {
      router.push(`/game/new?examId=${examId}`);
    }
  };

  return (
    <div className={style.containerV}>
      <>
        <div className={style.menu}>
          <Button type="button" onClick={() => router.push("/student")}>
            Gerenciar estudantes
          </Button>
          {/* falta adicionar link para a pagina de estudantes */}
          <Button type="button" onClick={() => goToGenerate()}>
            Gerar questões
          </Button>
        </div>
        <div className={style.containerH}>
          <div className={style.filter}>
            {isPending ? (
              <p>Loading...</p>
            ) : (
              <form className={style.form}>
                <div className={style.filterListItem}>
                  <p>Categoria</p>
                  <Dropdown
                    options={categories}
                    selectedValue={category}
                    onChange={(value) => {
                      setCategory(value);
                      handlerCategoryChange(value);
                    }}
                  />
                </div>
                <div className={style.filterListItem}>
                  <p>SubCategoria</p>
                  <Dropdown
                    options={subCategories}
                    selectedValue={subCategory}
                    onChange={(value) => {
                      setSubCategory(value);
                      handlerSubCategoryChange(value);
                    }}
                    disabled={
                      categories.length === 0 ||
                      category === "Selecione uma Categoria"
                    }
                  />
                </div>
                <div className={style.filterListItem}>
                  <p>Tópico</p>
                  <Dropdown
                    options={subjects}
                    selectedValue={subject}
                    onChange={(value) => {
                      setSubject(value);
                      handlerSubjectChange(value);
                    }}
                    disabled={
                      subCategories.length === 0 ||
                      subCategory === "Selecione uma SubCategoria"
                    }
                  />
                </div>
              </form>
            )}
          </div>

          <div className={style.questions}>
            <h3>Questões: {questionsFiltered.length}</h3>
            <Button type="button" onClick={() => goToExam()}>
              Iniciar exame
            </Button>
            <Button type="button" onClick={() => goToAssignExam()}>
              Gerar Exame<br></br> para Estudantes
            </Button>
            <Button type="button" onClick={() => goToStartGame()}>
              Iniciar Jogo
            </Button>
          </div>
        </div>
      </>
    </div>
  );
}
