"use client";

import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import T7UploadScreen, { SessionData } from "@/components/knowledge/T7UploadScreen";
import T7LearningDashboard from "@/components/knowledge/T7LearningDashboard";

export default function Page() {
  const [session, setSession] = useState<SessionData | null>(null);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-[13px] text-[var(--muted-foreground)]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      {!session ? (
        <T7UploadScreen onSessionCreated={setSession} />
      ) : (
        <T7LearningDashboard 
            session={session} 
            onReset={() => setSession(null)} 
        />
      )}
    </Suspense>
  );
}
