import { User as NextAuthUser } from "next-auth";

interface User extends NextAuthUser {
  level?: number;
}

export default User;
