"use client";
import React, {
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
  useTransition,
} from "react";
import Header from "../../components/sessions/header/header";
import styles from "./page.module.css";
import { useSession } from "next-auth/react";
import {
  generateQuestions,
  GenerateQuestionsParams,
  getQuestions,
  getSubcategory,
  getCategory,
} from "../../service/questions.service";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "./loading";
import DropdownInput from "../../components/elements/dropdown_input/dropdown_input";

const GeneratorPage = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    category: "",
    subCategory: "",
    subject: "",
    lang: "Português",
    numberOfQuestions: "8",
    type: "",
    prompt: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
  });

  const [errors, setErrors] = useState({ category: "", subCategory: "" });

  // Atualiza os valores do formulário a partir dos parâmetros da URL
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      category: searchParams?.get("category") || "",
      subCategory: searchParams?.get("subCategory") || "",
      subject: searchParams?.get("subject") || "",
    }));
  }, [searchParams]);

  // Busca categorias, subcategorias e assuntos
  useEffect(() => {
    if (!userEmail) return;

    const fetchQuestionElements = async () => {
      try {
        const categoryList = await getCategory(userEmail);
        const subCategoryList = await getSubcategory(
          formData.category,
          userEmail
        );
        const questions =
          (await getQuestions(
            userEmail,
            formData.category,
            formData.subCategory
          )) || [];

        const subjectList = Array.from(
          new Set(
            questions.map((question) =>
              String(question?.subject || question?.subJect || "")
            )
          )
        );

        setCategories(categoryList);
        setSubCategories(subCategoryList);
        setSubjects(subjectList);
      } catch (error) {
        console.error("Erro ao buscar questões", error);
      }
    };

    fetchQuestionElements();
  }, [userEmail, formData.category, formData.subCategory]);

  // Atualiza os valores do formulário para inputs normais
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = { category: "", subCategory: "" };
    if (!formData.category) newErrors.category = "Categoria é obrigatória";
    if (!formData.subCategory)
      newErrors.subCategory = "Subcategoria é obrigatória";

    setErrors(newErrors);
    return !newErrors.category && !newErrors.subCategory;
  };

  // Envio do formulário
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data: GenerateQuestionsParams = {
      userEmail,
      category: formData.category,
      subCategory: formData.subCategory,
      subject: formData.subject,
      lang: formData.lang,
      numberOfQuestions: Math.min(20, parseInt(formData.numberOfQuestions, 10)),
      type: formData.type,
      prompt: formData.prompt,
      difficulty: formData.difficulty,
    };

    try {
      await startTransition(async () => {
        const respExamId = await generateQuestions(data);
        router.push(`/exam?examId=${respExamId}`);
      });
    } catch (error) {
      console.error("Erro ao gerar questões", error);
    }
  };

  return (
    <>
      {isPending ? (
        <Loading />
      ) : (
        <>
          <Header />

          <form onSubmit={handleSubmit} className={styles.form}>
            <DropdownInput
              label="Categoria *"
              name="category"
              value={formData.category}
              options={categories}
              onChange={(name, value) =>
                setFormData((prev) => ({ ...prev, [name]: value }))
              }
              error={errors.category}
            />

            <DropdownInput
              label="Subcategoria *"
              name="subCategory"
              value={formData.subCategory}
              options={subCategories}
              onChange={(name, value) =>
                setFormData((prev) => ({ ...prev, [name]: value }))
              }
              error={errors.subCategory}
            />

            <DropdownInput
              label="Assunto específico"
              name="subject"
              value={formData.subject}
              options={subjects}
              onChange={(name, value) =>
                setFormData((prev) => ({ ...prev, [name]: value }))
              }
              error=""
            />
            <div>
              <label>Linguagem</label>
              <input
                name="lang"
                value={formData.lang}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ex., Inglês"
              />
            </div>

            <div>
              <label>Número de questões</label>
              <input
                type="number"
                name="numberOfQuestions"
                value={formData.numberOfQuestions}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ex: 10"
              />
            </div>

            <div className={styles.difficultyGroup}>
              <label>Nível de dificuldade</label>
              <div className={styles.difficultyOptions}>
                {(
                  [
                    {
                      value: "easy",
                      label: "Fácil",
                      description:
                        "Perguntas simples para crianças, linguagem clara e conceitos básicos.",
                    },
                    {
                      value: "medium",
                      label: "Médio",
                      description:
                        "Linguagem padrão para adultos; conhecimento geral sem especialização.",
                    },
                    {
                      value: "hard",
                      label: "Difícil",
                      description:
                        "Perguntas técnicas para especialistas, terminologia avançada e raciocínio aprofundado.",
                    },
                  ] as {
                    value: "easy" | "medium" | "hard";
                    label: string;
                    description: string;
                  }[]
                ).map(({ value, label, description }) => (
                  <label
                    key={value}
                    className={`${styles.difficultyOption} ${
                      formData.difficulty === value
                        ? styles.difficultySelected
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={value}
                      checked={formData.difficulty === value}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, difficulty: value }))
                      }
                    />
                    <div>
                      <span className={styles.difficultyLabel}>{label}</span>
                      <span className={styles.difficultyDescription}>
                        {description}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={styles.promptLabel}>
                Cole um text, um article ou dê detalhes sobre como gostaria que
                a questão fosse elaborada
              </label>
              <textarea
                name="prompt"
                value={formData.prompt}
                onChange={handleChange}
                className={styles.textarea}
                rows={5}
                placeholder="Ex: Teoria da relatividade ou https://example.com/article"
              />
            </div>

            <button type="submit">Gerar</button>
          </form>
        </>
      )}
    </>
  );
};

export default GeneratorPage;
