"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { dark } from "@clerk/themes";
import { ReactNode } from "react";

// Module-level singleton -- safe across re-renders and React Strict Mode.
// Guarded with typeof window check so the server build doesn't blow up on
// missing env vars during static analysis.
let convex: ConvexReactClient | null = null;

function getConvexClient(): ConvexReactClient {
  if (!convex) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL is not set. Add it to your .env.local file."
      );
    }
    convex = new ConvexReactClient(url);
  }
  return convex;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = getConvexClient();

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#ffffff",
          colorBackground: "#0a0a0a",
        },
      }}
    >
      <ConvexProviderWithClerk client={client} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
