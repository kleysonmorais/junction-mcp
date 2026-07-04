import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import Home from "@/components/Home";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Page() {
  return (
    <>
      <NavBar />
      <main>
        <Home />
      </main>
    </>
  );
}
