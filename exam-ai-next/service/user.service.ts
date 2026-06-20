import User from "../models/user";

type CreateUserParams = {
  user?: User;
  message?: string;
  error?: string;
};

type UpdateUserParams = {
  name?: string;
  email?: string;
  password?: string;
};

const createUser = async (user: User): Promise<CreateUserParams> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/proxy?path=users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    },
  );
  const result = await response.json();
  if (!result.data) {
    return { error: result.message };
  }
  return { user: result.data, message: result.message };
};

const getUser = async (email: string): Promise<User> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/proxy?path=users/email/${email}`,
  );
  const result = await response.json();
  return result.data;
};

const updateUser = async (
  id: string,
  user: UpdateUserParams,
): Promise<User> => {
  const response = await fetch(`/api/proxy?path=users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  const result = await response.json();
  return result.data;
};

const addStudent = async (
  userEmail: string,
  studentEmail: string,
): Promise<User> => {
  const response = await fetch(
    `/api/proxy?path=users/students/${userEmail}/${studentEmail}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const result = await response.json();
  return result.data;
};

const removeStudent = async (
  userEmail: string,
  studentEmail: string,
): Promise<User> => {
  const response = await fetch(
    `/api/proxy?path=users/students/${userEmail}/${studentEmail}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const result = await response.json();
  return result.data;
};

export { createUser, getUser, updateUser, addStudent, removeStudent };
