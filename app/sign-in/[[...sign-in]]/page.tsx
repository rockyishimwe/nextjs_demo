import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign In | DevEvent",
};

const SignInPage = () => {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-6">
      <h1 className="text-center">Sign In</h1>
      <SignIn />
    </section>
  );
};

export default SignInPage;
