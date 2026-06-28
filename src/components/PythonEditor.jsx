import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "#080810",
    color: "#e8e4f0",
    fontSize: "12px",
    height: "100%",
  },
  "&.cm-focused": { outline: "2px solid #7c3aed", outlineOffset: "-1px" },
  ".cm-scroller": {
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    lineHeight: "1.6",
    overflow: "auto",
  },
  ".cm-gutters": {
    backgroundColor: "#080810",
    color: "#4a4560",
    borderRight: "1px solid #1a1830",
  },
  ".cm-activeLineGutter": { backgroundColor: "rgba(124, 58, 237, 0.08)" },
  ".cm-activeLine": { backgroundColor: "rgba(124, 58, 237, 0.05)" },
  ".cm-cursor": { borderLeftColor: "#a78bfa" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(124, 58, 237, 0.28) !important",
  },
});

export default function PythonEditor({ code, filename, onChange, readOnly = false, height }) {
  const bodyRef = useRef(null);
  const [editorHeight, setEditorHeight] = useState(height ?? "200px");
  const extensions = useMemo(() => [python(), editorTheme, EditorView.lineWrapping], []);

  useEffect(() => {
    if (height) {
      setEditorHeight(height);
      return undefined;
    }

    const el = bodyRef.current;
    if (!el) return undefined;

    const syncHeight = () => {
      const next = el.clientHeight;
      if (next > 0) setEditorHeight(`${next}px`);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [height]);

  return (
    <div className="editor-shell">
      <div className="editor-chrome">
        <div className="editor-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="editor-tab">{filename}</span>
        <span className="editor-lang">Python · LangGraph</span>
      </div>
      <div className="editor-body" ref={bodyRef}>
        <CodeMirror
          value={code}
          height={editorHeight}
          theme="dark"
          extensions={extensions}
          editable={!readOnly}
          onChange={readOnly ? undefined : onChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            indentOnInput: true,
            bracketMatching: true,
            scrollPastEnd: false,
          }}
        />
      </div>
    </div>
  );
}
