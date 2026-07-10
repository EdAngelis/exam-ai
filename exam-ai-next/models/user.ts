interface User {
  _id?: string;
  username?: string;
  level?: number;
  students?: string[];
  email: string;
  password?: string;
  name?: string;
  id?: string;
  gameInviteCode?: string;
}

export default User;
