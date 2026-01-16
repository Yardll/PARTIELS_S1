import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { z } from "zod";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register Chat Routes
  registerChatRoutes(app);

  // Snippets Routes
  app.get(api.snippets.list.path, async (req, res) => {
    const snippets = await storage.getSnippets();
    res.json(snippets);
  });

  app.get(api.snippets.get.path, async (req, res) => {
    const snippet = await storage.getSnippet(Number(req.params.id));
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }
    res.json(snippet);
  });

  app.post(api.snippets.create.path, async (req, res) => {
    try {
      const input = api.snippets.create.input.parse(req.body);
      const snippet = await storage.createSnippet(input);
      res.status(201).json(snippet);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.snippets.update.path, async (req, res) => {
    try {
      const input = api.snippets.update.input.parse(req.body);
      // Wait, the storage update expects Partial<InsertSnippet>. 
      // But db.update().where() returns array. If empty, not found.
      // My implementation in storage.ts had a typo with returning() placement?
      // Let's assume storage works or fix it if needed. 
      // Actually, storage.updateSnippet logic: `await db.update...where(...).returning()`
      // If result is empty array, it means not found.
      
      // Let's implement update logic correctly here assuming storage handles it
      // But storage implementation I wrote: `where(eq(snippets.id, id).returning())` -> This is wrong syntax for drizzle.
      // returning() should be chained to update(), not inside where().
      // I'll fix storage.ts in a subsequent step if I can't edit it now.
      // Wait, I am writing storage.ts in the SAME batch. I should fix it THERE.
      // Ah, I already submitted the tool calls. I can't "fix" it in the thought trace.
      // I have to hope I wrote it correctly or fix it after.
      // In storage.ts I wrote: `where(eq(snippets.id, id).returning())`. That IS wrong.
      // `eq(..)` returns a SQL chunk. `.returning()` is a method on the QueryBuilder.
      // So `db.update(..).set(..).where(..).returning()` is correct.
      // My previous tool call had `where(eq(snippets.id, id).returning())` which is syntactically invalid for Drizzle probably.
      // I will correct it in a follow-up if it fails, or I can try to overwrite it now?
      // I can't overwrite in the same turn if I already sent the call?
      // No, I haven't sent the calls yet! I'm "thinking" right now.
      // I am constructing the tool calls. So I will fix `server/storage.ts` content in the WRITE call I am about to make.

      const snippet = await storage.getSnippet(Number(req.params.id));
      if (!snippet) {
         return res.status(404).json({ message: 'Snippet not found' });
      }
      
      // Actually I need to implement updateSnippet properly in storage.ts
      // I will just use create for now as 'save' often implies create or update.
      // But I defined PUT. Let's try to implement it.
      
      // For now, let's just create new snippet on "Save" if I can't get update working easily without fixing storage.
      // But I will fix storage.ts in the write tool call below.
      
      const updated = await storage.updateSnippet(Number(req.params.id), input);
      if (!updated) return res.status(404).json({ message: 'Snippet not found' });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.snippets.delete.path, async (req, res) => {
    await storage.deleteSnippet(Number(req.params.id));
    res.status(204).send();
  });

  // Execution Route
  app.post(api.execute.run.path, async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ output: "", error: "No code provided" });

    // Create temp directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cpp-playground-'));
    const sourcePath = path.join(tempDir, 'main.cpp');
    const exePath = path.join(tempDir, 'main.out');

    try {
      await fs.writeFile(sourcePath, code);

      // Compile
      // g++ main.cpp -o main.out
      await new Promise<void>((resolve, reject) => {
        exec(`g++ "${sourcePath}" -o "${exePath}"`, (error, stdout, stderr) => {
          if (error) {
            reject({ output: stdout, error: stderr || error.message });
          } else {
            resolve();
          }
        });
      });

      // Run
      // ./main.out
      const output = await new Promise<string>((resolve, reject) => {
        // Timeout 5s
        exec(`"${exePath}"`, { timeout: 5000 }, (error, stdout, stderr) => {
          if (error) {
            // Check if killed by timeout
            if (error.signal === 'SIGTERM') {
              reject({ output: stdout, error: "Execution timed out (5s limit)" });
            } else {
              reject({ output: stdout, error: stderr || error.message });
            }
          } else {
            resolve(stdout + (stderr ? `\nStderr:\n${stderr}` : ""));
          }
        });
      });

      res.json({ output });

    } catch (err: any) {
      res.json({ output: err.output || "", error: err.error || err.message });
    } finally {
      // Cleanup
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Failed to cleanup temp dir:", e);
      }
    }
  });

  return httpServer;
}
