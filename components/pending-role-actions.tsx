"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PendingRoleActions({ roleId }: { roleId: string }) {
  const router = useRouter();
  async function activate() {
    const res = await fetch(`/api/user-roles/${roleId}`, { method: "PATCH" });
    if (res.ok) {
      router.refresh();
    }
  }
  async function cancel() {
    const res = await fetch(`/api/user-roles/${roleId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={activate}>Activate</Button>
      <Button size="sm" variant="outline" onClick={cancel}>
        Cancel
      </Button>
    </div>
  );
}

