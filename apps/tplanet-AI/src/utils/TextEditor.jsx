import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const headingOptions = [
    { label: "Paragraph", value: "paragraph" },
    { label: "Heading 1", value: "h1" },
    { label: "Heading 2", value: "h2" },
    { label: "Heading 3", value: "h3" },
  ];

  const handleHeadingChange = (e) => {
    const value = e.target.value;
    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
    } else {
      editor
        .chain()
        .focus()
        .toggleHeading({ level: parseInt(value.slice(1)) })
        .run();
    }
  };

  const handleButtonClick = (e, command) => {
    e.preventDefault();
    command();
  };

  return (
    <div className="flex items-center p-2 border-b border-gray-200 bg-white">
      <select
        onChange={handleHeadingChange}
        className="mr-2 p-1 border border-gray-300 rounded-md text-sm"
        value={
          editor.isActive("heading", { level: 1 })
            ? "h1"
            : editor.isActive("heading", { level: 2 })
            ? "h2"
            : editor.isActive("heading", { level: 3 })
            ? "h3"
            : "paragraph"
        }
      >
        {headingOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="flex space-x-2 border-l border-gray-200 pl-2">
        <button
          onClick={(e) =>
            handleButtonClick(e, () =>
              editor.chain().focus().toggleBold().run()
            )
          }
          className={`p-2 rounded hover:bg-gray-100 ${
            editor.isActive("bold") ? "bg-gray-100" : ""
          }`}
        >
          <i className="fas fa-bold"></i>
        </button>

        <button
          onClick={(e) =>
            handleButtonClick(e, () =>
              editor.chain().focus().toggleItalic().run()
            )
          }
          className={`p-1 rounded hover:bg-gray-100 ${
            editor.isActive("italic") ? "bg-gray-100" : ""
          }`}
        >
          <i className="fas fa-italic"></i>
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            const url = window.prompt("Enter URL:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`p-1 rounded hover:bg-gray-100 ${
            editor.isActive("link") ? "bg-gray-100" : ""
          }`}
        >
          <i className="fas fa-link"></i>
        </button>

        <button
          onClick={(e) =>
            handleButtonClick(e, () =>
              editor.chain().focus().toggleBulletList().run()
            )
          }
          className={`p-1 rounded hover:bg-gray-100 ${
            editor.isActive("bulletList") ? "bg-gray-100" : ""
          }`}
        >
          <i className="fas fa-list-ul"></i>
        </button>

        <button
          onClick={(e) =>
            handleButtonClick(e, () =>
              editor.chain().focus().toggleOrderedList().run()
            )
          }
          className={`p-1 rounded hover:bg-gray-100 ${
            editor.isActive("orderedList") ? "bg-gray-100" : ""
          }`}
        >
          <i className="fas fa-list-ol"></i>
        </button>
      </div>

      <div className="flex space-x-1 border-l border-gray-200 pl-2 ml-2">
        <button
          onClick={(e) =>
            handleButtonClick(e, () => editor.chain().focus().undo().run())
          }
          className="p-1 rounded hover:bg-gray-100"
        >
          <i className="fas fa-undo"></i>
        </button>
        <button
          onClick={(e) =>
            handleButtonClick(e, () => editor.chain().focus().redo().run())
          }
          className="p-1 rounded hover:bg-gray-100"
        >
          <i className="fas fa-redo"></i>
        </button>
      </div>
    </div>
  );
};

const Tiptap = ({
  setDescription,
  initialContent = "",
  placeholder = "",
  className = "",
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setDescription(html);
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  return (
    <div className={`w-full border rounded-md overflow-hidden ${className}`}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="p-4 min-h-[200px]" />
    </div>
  );
};

export default Tiptap;
