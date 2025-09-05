"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserRoleForm } from "@/components/user-role-form";

interface UserRoleDialogProps {
  tenantId: string;
  roles: string[];
  userRole?: { id: string; email: string; roleName: string };
  trigger?: ReactNode;
}

export function UserRoleDialog({ tenantId, roles, userRole, trigger }: UserRoleDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Add User</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{userRole ? "Update User" : "Add User"}</DialogTitle>
        </DialogHeader>
        <UserRoleForm
          tenantId={tenantId}
          roles={roles}
          userRole={userRole}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
