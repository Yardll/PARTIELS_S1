import Editor, { type OnMount } from "@monaco-editor/react";
import { useRef } from "react";
import { Loader2 } from "lucide-react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
}

export function CodeEditor({ code, onChange, readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Custom VS Code Dark Theme tweaks if needed
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e', // Matches Tailwind --background roughly
      }
    });
    monaco.editor.setTheme('custom-dark');
  };

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="cpp"
        language="cpp"
        theme="vs-dark"
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          fontLigatures: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
        }}
        loading={
          <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Initializing Editor...</span>
          </div>
        }
      />
    </div>
  );
}
