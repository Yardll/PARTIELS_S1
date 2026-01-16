import { useState, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sidebar } from "@/components/Sidebar";
import { CodeEditor } from "@/components/CodeEditor";
import { ChatPanel } from "@/components/ChatPanel";
import { Button } from "@/components/ui/button";
import { Play, Save, Loader2, TerminalSquare, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useExecute } from "@/hooks/use-execute";
import { useUpdateSnippet } from "@/hooks/use-snippets";
import type { Snippet } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_CODE = `#include <iostream>
#include <vector>
#include <string>

// Simple C++ Example
int main() {
    std::vector<std::string> msg {"Hello", "C++", "World", "from", "Replit!"};
    
    for (const auto& word : msg) {
        std::cout << word << " ";
    }
    std::cout << std::endl;
    
    return 0;
}`;

export default function Home() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [currentSnippet, setCurrentSnippet] = useState<Snippet | null>(null);
  const [output, setOutput] = useState("");
  const [executionError, setExecutionError] = useState<string | undefined>(undefined);
  
  const execute = useExecute();
  const updateSnippet = useUpdateSnippet();
  const { toast } = useToast();

  const handleSnippetSelect = (snippet: Snippet) => {
    setCurrentSnippet(snippet);
    setCode(snippet.code);
    setOutput("");
    setExecutionError(undefined);
  };

  const handleRun = () => {
    setOutput("");
    setExecutionError(undefined);
    execute.mutate(code, {
      onSuccess: (data) => {
        setOutput(data.output);
        setExecutionError(data.error);
      },
    });
  };

  const handleSave = () => {
    if (currentSnippet) {
      updateSnippet.mutate({ id: currentSnippet.id, code });
    } else {
      toast({
        title: "No Snippet Selected",
        description: "Please create or select a snippet from the sidebar first.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Top Bar / Menu */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono font-bold text-primary tracking-tighter">
            <TerminalSquare className="h-5 w-5" />
            <span>CPP.PLAYGROUND</span>
          </div>
          {currentSnippet && (
             <div className="text-sm text-muted-foreground border-l border-border pl-4">
                Editing: <span className="text-foreground font-medium">{currentSnippet.title}</span>
             </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary"
            className="gap-2 h-8"
            onClick={handleSave}
            disabled={!currentSnippet || updateSnippet.isPending}
          >
            {updateSnippet.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>
          <Button 
            size="sm" 
            className="gap-2 h-8 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleRun}
            disabled={execute.isPending}
          >
            {execute.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run Code
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar: Snippets */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden md:block">
            <Sidebar 
              currentSnippetId={currentSnippet?.id || null} 
              onSelectSnippet={handleSnippetSelect}
            />
          </ResizablePanel>
          
          <ResizableHandle className="bg-border w-[1px]" />

          {/* Middle: Editor + Output */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* Editor */}
              <ResizablePanel defaultSize={70} minSize={20}>
                <div className="h-full flex flex-col">
                  <div className="panel-header">
                     <span className="flex items-center gap-2"><Code className="h-3.5 w-3.5" /> main.cpp</span>
                  </div>
                  <div className="flex-1 relative">
                    <CodeEditor 
                      code={code} 
                      onChange={(val) => setCode(val || "")} 
                    />
                  </div>
                </div>
              </ResizablePanel>
              
              <ResizableHandle className="bg-border h-[1px]" />

              {/* Output Panel */}
              <ResizablePanel defaultSize={30} minSize={10}>
                <div className="h-full flex flex-col bg-[#1e1e1e]">
                  <div className="panel-header border-t-0">
                    <span className="flex items-center gap-2">
                      <TerminalSquare className="h-3.5 w-3.5" /> 
                      Console Output
                    </span>
                    {execute.isPending && <span className="text-xs text-yellow-500 animate-pulse">Compiling & Running...</span>}
                  </div>
                  <div className="flex-1 p-4 font-mono text-sm overflow-auto whitespace-pre-wrap font-medium">
                    {execute.isPending ? (
                       <div className="text-muted-foreground italic">Waiting for execution...</div>
                    ) : executionError ? (
                       <div className="text-red-400 border-l-2 border-red-500 pl-2">
                          <div className="flex items-center gap-2 mb-2 font-bold text-red-500">
                            <AlertTriangle className="h-4 w-4" /> Compilation Error
                          </div>
                          {executionError}
                       </div>
                    ) : output ? (
                       <div className="text-green-400 border-l-2 border-green-500 pl-2">
                          <div className="flex items-center gap-2 mb-2 font-bold text-green-500">
                             <CheckCircle2 className="h-4 w-4" /> Execution Success
                          </div>
                          {output}
                       </div>
                    ) : (
                       <div className="text-muted-foreground opacity-50">Run code to see output here...</div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          <ResizableHandle className="bg-border w-[1px]" />

          {/* Right Sidebar: AI Chat */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <ChatPanel currentCode={code} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
