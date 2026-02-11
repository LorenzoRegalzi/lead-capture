"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ScanOverlay from "../../components/ScanOverlay";
import Loader from "../../components/Loader";

export default function DeleteSubmissionPage() {
  const params = useParams();
  const router = useRouter();

  const submissionId = params?.submissionId as string;

  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);
  const [showFinishProcess, setShowFinishProcess] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!submissionId) return;

    const deleteSubmission = async () => {
      try {
        const res = await fetch("/api/delete-photos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ submissionId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Delete failed");
        }

        setMessage("✅ Submission deleted successfully");
      } catch (err: any) {
        console.error("Delete error:", err);
        setMessage("❌ Error: " + err.message);
      } finally {
        setShowLoadingOverlay(false);
        setShowFinishProcess(true);
      }
    };

    deleteSubmission();
  }, [submissionId]);

  if (showLoadingOverlay) {
    return <Loader />;
  }

  if (showFinishProcess) {
    return (
      <ScanOverlay
        setShowScanOverlay={() => router.push("/")}
        text={message}
      />
    );
  }

  return null;
}
