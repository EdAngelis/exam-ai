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
    }
  );
  const data = await response.json();
  return data;
};

const getUser = async (email: string): Promise<User> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/proxy?path=users/email/${email}`
  );
  const data = await response.json();
  return data.user;
};

const updateUser = async (
  id: string,
  user: UpdateUserParams
): Promise<User> => {
  const response = await fetch(`/api/proxy?path=users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  const data = await response.json();
  return data.user;
};

const addStudent = async (
  userEmail: string,
  studentEmail: string
): Promise<User> => {
  const response = await fetch(
    `/api/proxy?path=users/students/${userEmail}/${studentEmail}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  return data.user;
};

const removeStudent = async (
  userEmail: string,
  studentEmail: string
): Promise<User> => {
  const response = await fetch(
    `/api/proxy?path=users/students/${userEmail}/${studentEmail}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  return data.user;
};

export { createUser, getUser, updateUser, addStudent, removeStudent };
