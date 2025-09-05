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

const schema = z.object({ name: z.string().min(1, "Name is required") });

export function TenantForm({
  tenant,
  onSuccess,
}: {
  tenant?: { id: string; name: string };
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: tenant?.name ?? "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setError(null);
    const res = await fetch(tenant ? `/api/tenants/${tenant.id}` : "/api/tenants", {
      method: tenant ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit">{tenant ? "Update" : "Create"} Tenant</Button>
      </form>
    </Form>
  );
}
