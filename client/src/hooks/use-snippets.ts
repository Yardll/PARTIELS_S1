import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertSnippet, Snippet } from "@shared/schema";

// GET /api/snippets
export function useSnippets() {
  return useQuery({
    queryKey: [api.snippets.list.path],
    queryFn: async () => {
      const res = await fetch(api.snippets.list.path);
      if (!res.ok) throw new Error("Failed to fetch snippets");
      return api.snippets.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/snippets/:id
export function useSnippet(id: number | null) {
  return useQuery({
    queryKey: [api.snippets.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.snippets.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch snippet");
      return api.snippets.get.responses[200].parse(await res.json());
    },
  });
}

// POST /api/snippets
export function useCreateSnippet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSnippet) => {
      const res = await fetch(api.snippets.create.path, {
        method: api.snippets.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create snippet");
      }
      return api.snippets.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.snippets.list.path] });
      toast({ title: "Success", description: "Snippet saved successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

// PUT /api/snippets/:id
export function useUpdateSnippet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertSnippet>) => {
      const url = buildUrl(api.snippets.update.path, { id });
      const res = await fetch(url, {
        method: api.snippets.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update snippet");
      return api.snippets.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.snippets.list.path] });
      toast({ title: "Success", description: "Snippet updated" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

// DELETE /api/snippets/:id
export function useDeleteSnippet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.snippets.delete.path, { id });
      const res = await fetch(url, { method: api.snippets.delete.method });
      if (!res.ok) throw new Error("Failed to delete snippet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.snippets.list.path] });
      toast({ title: "Deleted", description: "Snippet removed" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}
