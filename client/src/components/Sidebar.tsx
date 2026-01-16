import { Plus, Code, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSnippets, useCreateSnippet, useDeleteSnippet } from "@/hooks/use-snippets";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Snippet } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface SidebarProps {
  currentSnippetId: number | null;
  onSelectSnippet: (snippet: Snippet) => void;
}

export function Sidebar({ currentSnippetId, onSelectSnippet }: SidebarProps) {
  const { data: snippets, isLoading } = useSnippets();
  const createSnippet = useCreateSnippet();
  const deleteSnippet = useDeleteSnippet();
  
  const [search, setSearch] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const filteredSnippets = snippets?.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    
    createSnippet.mutate(
      { 
        title: newTitle, 
        code: `#include <iostream>\n\nint main() {\n    std::cout << "Hello from ${newTitle}!" << std::endl;\n    return 0;\n}`,
        language: "cpp" 
      }, 
      {
        onSuccess: (newSnippet) => {
          setIsNewDialogOpen(false);
          setNewTitle("");
          onSelectSnippet(newSnippet);
        }
      }
    );
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this snippet?")) {
      deleteSnippet.mutate(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="panel-header">
        <span>Explorer</span>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-3">
        <Button 
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-white" 
          size="sm"
          onClick={() => setIsNewDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Snippet
        </Button>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="h-8 pl-8 text-xs bg-background/50 border-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-0.5">
          {isLoading ? (
            <div className="text-center p-4 text-xs text-muted-foreground">Loading...</div>
          ) : filteredSnippets?.length === 0 ? (
            <div className="text-center p-4 text-xs text-muted-foreground">No snippets found.</div>
          ) : (
            filteredSnippets?.map((snippet) => (
              <div
                key={snippet.id}
                onClick={() => onSelectSnippet(snippet)}
                className={cn(
                  "group flex items-center justify-between p-2 rounded cursor-pointer text-sm transition-colors",
                  currentSnippetId === snippet.id 
                    ? "bg-secondary text-secondary-foreground" 
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                <div className="flex flex-col truncate">
                  <span className="flex items-center gap-2 truncate font-medium">
                    <Code className="h-3 w-3 text-blue-500" />
                    {snippet.title}
                  </span>
                  <span className="text-[10px] opacity-60 ml-5">
                    {snippet.createdAt && format(new Date(snippet.createdAt), "MMM d, HH:mm")}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                  onClick={(e) => handleDelete(e, snippet.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* New Snippet Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Snippet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Snippet Name</Label>
              <Input 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)} 
                placeholder="My Awesome Algorithm"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createSnippet.isPending}>
              {createSnippet.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
