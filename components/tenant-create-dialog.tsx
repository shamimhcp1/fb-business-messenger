"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TenantForm } from "@/components/tenant-form";

export function TenantCreateDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Tenant</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tenant</DialogTitle>
        </DialogHeader>
        <TenantForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
