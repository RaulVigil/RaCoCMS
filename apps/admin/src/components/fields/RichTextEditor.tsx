import { useEditor, useEditorState, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, Quote, Undo2, Redo2 } from 'lucide-react';

interface Props {
  value: JSONContent | null;
  onChange: (value: JSONContent | null) => void;
}

// El contenido se guarda como el JSON de Tiptap/ProseMirror, nunca como HTML
export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: false })],
    content: value ?? '',
    editorProps: {
      attributes: {
        class:
          'min-h-40 px-3 py-2 text-sm text-primary focus:outline-none [&_p]:my-1.5 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-3 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-secondary [&_blockquote]:pl-3 [&_blockquote]:text-tertiary',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? null : editor.getJSON()),
  });

  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      strike: editor?.isActive('strike') ?? false,
      h2: editor?.isActive('heading', { level: 2 }) ?? false,
      h3: editor?.isActive('heading', { level: 3 }) ?? false,
      bulletList: editor?.isActive('bulletList') ?? false,
      orderedList: editor?.isActive('orderedList') ?? false,
      blockquote: editor?.isActive('blockquote') ?? false,
    }),
  });

  if (!editor) return null;

  const tools = [
    { icon: Bold, on: active?.bold, run: () => editor.chain().focus().toggleBold().run() },
    { icon: Italic, on: active?.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { icon: Strikethrough, on: active?.strike, run: () => editor.chain().focus().toggleStrike().run() },
    { icon: Heading2, on: active?.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: Heading3, on: active?.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { icon: List, on: active?.bulletList, run: () => editor.chain().focus().toggleBulletList().run() },
    { icon: ListOrdered, on: active?.orderedList, run: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: Quote, on: active?.blockquote, run: () => editor.chain().focus().toggleBlockquote().run() },
  ];

  return (
    <div className="rounded-md border border-tertiary/30 bg-white focus-within:ring-2 focus-within:ring-secondary/50">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-tertiary/20 px-1.5 py-1">
        {tools.map(({ icon: Icon, on, run }, i) => (
          <button
            key={i}
            type="button"
            onClick={run}
            className={`p-1.5 rounded ${on ? 'bg-secondary/15 text-secondary' : 'text-tertiary hover:text-primary hover:bg-background'}`}
          >
            <Icon size={15} />
          </button>
        ))}
        <div className="ml-auto flex gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-background"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-background"
          >
            <Redo2 size={15} />
          </button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
