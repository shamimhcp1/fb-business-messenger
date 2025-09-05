"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  email: z.string().email(),
  roleName: z.string().min(1),
});

interface UserRoleFormProps {
  tenantId: string;
  roles: string[];
  userRole?: { id: string; email: string; roleName: string };
  onSuccess?: () => void;
}

export function UserRoleForm({ tenantId, roles, userRole, onSuccess }: UserRoleFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: userRole?.email ?? "",
      roleName: userRole?.roleName ?? roles[0] ?? "",
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setError(null);
    const res = await fetch(
      userRole
        ? `/api/tenants/${tenantId}/users/${userRole.id}`
        : `/api/tenants/${tenantId}/users`,
      {
        method: userRole ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Request failed");
      return;
    }
    router.refresh();
    onSuccess?.();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roleName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <select
                  className="border rounded px-2 py-2 w-full bg-transparent"
                  {...field}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit">{userRole ? "Update" : "Add"} User</Button>
      </form>
    </Form>
  );
}
