import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Eye, 
  EyeOff,
  Type,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    const text = prompt('Enter link text:') || 'link';
    if (url) {
      insertText(`[${text}](${url})`);
    }
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertText('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertText('*', '*'), title: 'Italic' },
    { icon: Underline, action: () => insertText('<u>', '</u>'), title: 'Underline' },
    { icon: Heading1, action: () => insertText('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertText('## '), title: 'Heading 2' },
    { icon: Heading3, action: () => insertText('### '), title: 'Heading 3' },
    { icon: List, action: () => insertText('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertText('1. '), title: 'Numbered List' },
    { icon: Link, action: insertLink, title: 'Insert Link' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertText('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertText('*', '*');
          break;
        case 'u':
          e.preventDefault();
          insertText('<u>', '</u>');
          break;
        case 'k':
          e.preventDefault();
          insertLink();
          break;
      }
    }
  };

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center space-x-2">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={button.action}
              title={button.title}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              <button.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center space-x-2 px-3 py-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="text-sm">{showPreview ? 'Edit' : 'Preview'}</span>
        </button>
      </div>

      {/* Editor/Preview */}
      <div className="relative">
        {showPreview ? (
          <div className="p-4 min-h-[200px] prose prose-invert prose-cyan max-w-none">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: value
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                  .replace(/^- (.*$)/gm, '<li>$1</li>')
                  .replace(/^1\. (.*$)/gm, '<li>$1</li>')
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                  .replace(/\n/g, '<br>')
              }} 
            />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Write your content in Markdown...'}
            className="w-full p-4 min-h-[200px] bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none"
            style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
          />
        )}
      </div>

      {/* Help Text */}
      <div className="px-4 py-2 border-t border-white/10 bg-white/5">
        <p className="text-xs text-gray-400">
          Shortcuts: Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline), Ctrl+K (Link)
        </p>
      </div>
    </div>
  );
};

export default RichTextEditor;