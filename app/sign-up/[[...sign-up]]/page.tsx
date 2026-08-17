import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign Up | DevEvent",
};

const SignUpPage = () => {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-6">
      <h1 className="text-center">Sign Up</h1>
      <SignUp />
    </section>
  );
};

export default SignUpPage;
