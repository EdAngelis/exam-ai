import { apiClient, type ApiEnvelope } from '@/lib/api-client';
import type { User } from '@/models';

type UpdateUserParams = {
  name?: string;
  email?: string;
  password?: string;
};

const getUser = async (email: string): Promise<User> => {
  const res = await apiClient.get<ApiEnvelope<User>>(`users/email/${email}`);
  return res.data;
};

const updateUser = async (
  id: string,
  user: UpdateUserParams,
): Promise<User> => {
  const res = await apiClient.put<ApiEnvelope<User>>(`users/${id}`, user);
  return res.data;
};

const addStudent = async (
  userEmail: string,
  studentEmail: string,
): Promise<User> => {
  const res = await apiClient.get<ApiEnvelope<User>>(
    `users/students/${userEmail}/${studentEmail}`,
  );
  return res.data;
};

const removeStudent = async (
  userEmail: string,
  studentEmail: string,
): Promise<User> => {
  const res = await apiClient.delete<ApiEnvelope<User>>(
    `users/students/${userEmail}/${studentEmail}`,
  );
  return res.data;
};

export { getUser, updateUser, addStudent, removeStudent };
