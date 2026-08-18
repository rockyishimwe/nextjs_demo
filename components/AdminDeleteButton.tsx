"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent } from "@/lib/actions/event.actions";

const AdminDeleteButton = ({ slug, title }: { slug: string; title: string }) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (!window.confirm(`Delete "${title}"? This also removes its bookings.`)) {
      return;
    }

    setBusy(true);
    const result = await deleteEvent(slug);

    if (result.success) {
      router.refresh();
    } else {
      window.alert(result.message || "Delete failed");
      setBusy(false);
    }
  };

  return (
    <button type="button" className="action-delete" onClick={handleClick} disabled={busy}>
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
};

export default AdminDeleteButton;
