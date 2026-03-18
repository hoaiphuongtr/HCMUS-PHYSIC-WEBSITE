import type { Metadata } from "next";
import { Suspense } from "react";
import { OAuthCallbackView } from "@/views/oauth/oauth-callback-view";

export const metadata: Metadata = {
  title: "Google Login – HCMUS Physics Portal",
};

export default function OAuthGoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-hcmus-gray text-sm">Authenticating...</p>
        </div>
      }
    >
      <OAuthCallbackView />
    </Suspense>
  );
}
