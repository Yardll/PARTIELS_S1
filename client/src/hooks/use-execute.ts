import { useMutation } from "@tanstack/react-query";
import { api, type ExecuteResponse } from "@shared/routes";

export function useExecute() {
  return useMutation({
    mutationFn: async (code: string): Promise<ExecuteResponse> => {
      const res = await fetch(api.execute.run.path, {
        method: api.execute.run.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Execution failed");
      }

      return api.execute.run.responses[200].parse(await res.json());
    },
  });
}
