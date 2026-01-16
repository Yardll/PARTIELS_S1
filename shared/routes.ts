import { z } from 'zod';
import { insertSnippetSchema, snippets } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  snippets: {
    list: {
      method: 'GET' as const,
      path: '/api/snippets',
      responses: {
        200: z.array(z.custom<typeof snippets.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/snippets/:id',
      responses: {
        200: z.custom<typeof snippets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/snippets',
      input: insertSnippetSchema,
      responses: {
        201: z.custom<typeof snippets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/snippets/:id',
      input: insertSnippetSchema.partial(),
      responses: {
        200: z.custom<typeof snippets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/snippets/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  execute: {
    run: {
      method: 'POST' as const,
      path: '/api/execute',
      input: z.object({
        code: z.string(),
      }),
      responses: {
        200: z.object({
          output: z.string(),
          error: z.string().optional(),
        }),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type SnippetInput = z.infer<typeof api.snippets.create.input>;
export type ExecuteInput = z.infer<typeof api.execute.run.input>;
export type ExecuteResponse = z.infer<typeof api.execute.run.responses[200]>;
