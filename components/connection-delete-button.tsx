"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ConnectionDeleteButtonProps {
  tenantId: string;
  connectionId: string;
}

export function ConnectionDeleteButton({
  tenantId,
  connectionId,
}: ConnectionDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    setLoading(true);
    await fetch(`/api/tenants/${tenantId}/connections/${connectionId}`, {
      method: "DELETE",
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={onDelete}
      disabled={loading}
    >
      Delete
    </Button>
  );
}
