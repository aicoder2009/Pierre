"use client";

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useEffect, useState } from "react";

function useTauri() {
  const [isTauri, setIsTauri] = useState(false);
  useEffect(() => {
    setIsTauri(typeof window !== "undefined" && "__TAURI__" in window);
  }, []);
  return isTauri;
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useUser();
  const isTauri = useTauri();

  if (isLoaded && !isSignedIn) {
    redirect("/sign-in");
  }

  return (
    <div className={`flex h-screen overflow-hidden ${isTauri ? "pt-8" : ""}`}>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
