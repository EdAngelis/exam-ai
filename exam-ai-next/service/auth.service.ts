import User from "../models/user";

type SignInResponseParams = {
  data?: User;
  message?: string;
  token?: string;
};

type Response = {
  message: string;
  data: any;
  status: number;
};

const signInService = async (credentials: {
  email: string;
  password: string;
}): Promise<SignInResponseParams> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/proxy?path=auth/signin`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    }
  );
  const data = await response.json();
  console.log(data);
  return data;
};

const verifyEmail = async (code: string): Promise<Response> => {
  const response = await fetch(`/api/proxy?path=auth/validate-email/${code}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
};

const sendResetPasswordToken = async (email: string): Promise<Response> => {
  const response = await fetch(
    `/api/proxy?path=auth/send-reset-password-token/${email}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  console.log(data);
  return data;
};

const resetPassword = async (
  token: string,
  newPassword: string
): Promise<Response> => {
  const response = await fetch(`/api/proxy?path=auth/reset-password/${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
  });
  const data = await response.json();
  return data;
};

export { signInService, verifyEmail, sendResetPasswordToken, resetPassword };
