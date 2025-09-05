"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TenantForm } from "@/components/tenant-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function TenantActions({
  tenantId,
  tenantName,
  canEdit,
  canDelete,
}: {
  tenantId: string;
  tenantName: string;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function onDelete() {
    const res = await fetch(`/api/tenants/${tenantId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    }
  }

  if (!canEdit && !canDelete) {
    return null;
  }
  return (
    <div className="flex gap-2">
      {canEdit && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Edit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Tenant</DialogTitle>
            </DialogHeader>
            <TenantForm
              tenant={{ id: tenantId, name: tenantName }}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete
                the tenant <strong>{tenantName}</strong> and remove all its
                associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-700 hover:bg-red-500 text-white">Yes Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
