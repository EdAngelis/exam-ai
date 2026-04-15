"use client"
import { SessionProvider } from "next-auth/react"

interface NextAuthProviderProps {
  session?: any; // Made session optional
  children: React.ReactNode;
}

const NextAuthProvider = (props: NextAuthProviderProps) => {
  return <SessionProvider session={props.session}>{props.children}</SessionProvider>
}

export default NextAuthProvider
