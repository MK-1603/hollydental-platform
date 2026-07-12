"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Underline from '@tiptap/extension-underline'
import CharacterCount from '@tiptap/extension-character-count'
import Youtube from '@tiptap/extension-youtube'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon, Image as ImageIcon, Youtube as YoutubeIcon, Table as TableIcon, Underline as UnderlineIcon } from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Image,
      Youtube.configure({
        controls: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Start writing your article... (Use / for commands)',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none max-w-none min-h-[400px]',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) return

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('Image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addYoutube = () => {
    const url = window.prompt('YouTube URL')
    if (url) {
      editor.commands.setYoutubeVideo({ src: url, width: 640, height: 480 })
    }
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="flex flex-col border border-gray-200 rounded-[12px] bg-white overflow-hidden shadow-sm">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md p-0.5 shadow-sm">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('bold') ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Bold"><Bold className="w-4 h-4" /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('italic') ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Italic"><Italic className="w-4 h-4" /></button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('underline') ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Underline"><UnderlineIcon className="w-4 h-4" /></button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('strike') ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Strikethrough"><Strikethrough className="w-4 h-4" /></button>
          <button onClick={() => editor.chain().focus().toggleCode().run()} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('code') ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Code"><Code className="w-4 h-4" /></button>
        </div>

        <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md p-0.5 shadow-sm">
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Heading 1"><Heading1 className="w-4 h-4" /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Heading 2"><Heading2 className="w-4 h-4" /></button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Heading 3"><Heading3 className="w-4 h-4" /></button>
        </div>

        <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md p-0.5 shadow-sm">
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Bullet List"><List className="w-4 h-4" /></button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('blockquote') ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Blockquote"><Quote className="w-4 h-4" /></button>
        </div>
        
        <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md p-0.5 shadow-sm">
          <button onClick={toggleLink} className={`p-1.5 rounded-sm hover:bg-gray-100 transition-colors ${editor.isActive('link') ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'}`} title="Insert Link"><LinkIcon className="w-4 h-4" /></button>
          <button onClick={addImage} className="p-1.5 rounded-sm text-gray-600 hover:bg-gray-100 transition-colors" title="Insert Image"><ImageIcon className="w-4 h-4" /></button>
          <button onClick={addYoutube} className="p-1.5 rounded-sm text-gray-600 hover:bg-gray-100 transition-colors" title="Insert YouTube"><YoutubeIcon className="w-4 h-4" /></button>
          <button onClick={addTable} className="p-1.5 rounded-sm text-gray-600 hover:bg-gray-100 transition-colors" title="Insert Table"><TableIcon className="w-4 h-4" /></button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"><Undo className="w-4 h-4" /></button>
          <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"><Redo className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="p-6 md:p-8 flex-1 bg-white min-h-[400px]">
        <EditorContent editor={editor} />
      </div>
      
      {/* Footer / Character Count */}
      <div className="p-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end text-[12px] text-gray-500 font-medium">
        {editor.storage.characterCount.words()} words • {editor.storage.characterCount.characters()} characters
      </div>
    </div>
  )
}
