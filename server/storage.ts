import { snippets, type Snippet, type InsertSnippet } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { chatStorage, type IChatStorage } from "./replit_integrations/chat/storage";

export interface IStorage extends IChatStorage {
  getSnippet(id: number): Promise<Snippet | undefined>;
  getSnippets(): Promise<Snippet[]>;
  createSnippet(snippet: InsertSnippet): Promise<Snippet>;
  updateSnippet(id: number, snippet: Partial<InsertSnippet>): Promise<Snippet | undefined>;
  deleteSnippet(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Chat Storage Implementation (Delegating to the imported chatStorage implementation or re-implementing if needed)
  // Since we need to merge them into one class/interface if we want a single 'storage' export.
  // Actually, replit_integrations/chat/storage.ts exports 'chatStorage' object.
  // I can just mix it in or delegate.

  async getConversation(id: number) { return chatStorage.getConversation(id); }
  async getAllConversations() { return chatStorage.getAllConversations(); }
  async createConversation(title: string) { return chatStorage.createConversation(title); }
  async deleteConversation(id: number) { return chatStorage.deleteConversation(id); }
  async getMessagesByConversation(id: number) { return chatStorage.getMessagesByConversation(id); }
  async createMessage(conversationId: number, role: string, content: string) { return chatStorage.createMessage(conversationId, role, content); }

  // Snippet Storage Implementation
  async getSnippet(id: number): Promise<Snippet | undefined> {
    const [snippet] = await db.select().from(snippets).where(eq(snippets.id, id));
    return snippet;
  }

  async getSnippets(): Promise<Snippet[]> {
    return await db.select().from(snippets).orderBy(desc(snippets.createdAt));
  }

  async createSnippet(insertSnippet: InsertSnippet): Promise<Snippet> {
    const [snippet] = await db.insert(snippets).values(insertSnippet).returning();
    return snippet;
  }

  async updateSnippet(id: number, update: Partial<InsertSnippet>): Promise<Snippet | undefined> {
    const [snippet] = await db.update(snippets).set(update).where(eq(snippets.id, id)).returning();
    return snippet;
  }
  
  async deleteSnippet(id: number): Promise<void> {
    await db.delete(snippets).where(eq(snippets.id, id));
  }
}

export const storage = new DatabaseStorage();
