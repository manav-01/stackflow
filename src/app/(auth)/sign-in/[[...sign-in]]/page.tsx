import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return <SignIn forceRedirectUrl={"/"} />;
}
// https://clerk.com/docs/guides/custom-redirects#environment-variables
