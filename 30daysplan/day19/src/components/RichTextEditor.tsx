import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
  id
}) => {
  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  }), []);

  const formats = [
    'bold', 'italic', 'underline',
    'list', 'bullet'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        id={id}
        style={{
          backgroundColor: 'white',
          borderRadius: '0.375rem',
          border: '1px solid #d1d5db'
        }}
      />
      <style>{`
        .ql-toolbar {
          border-top: 1px solid #d1d5db;
          border-left: 1px solid #d1d5db;
          border-right: 1px solid #d1d5db;
          border-bottom: none;
          border-radius: 0.375rem 0.375rem 0 0;
          background: #f9fafb;
        }
        
        .ql-container {
          border-bottom: 1px solid #d1d5db;
          border-left: 1px solid #d1d5db;
          border-right: 1px solid #d1d5db;
          border-top: none;
          border-radius: 0 0 0.375rem 0.375rem;
          font-family: inherit;
        }
        
        .ql-editor {
          min-height: 120px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        
        .ql-toolbar .ql-stroke {
          fill: none;
          stroke: #374151;
        }
        
        .ql-toolbar .ql-fill {
          fill: #374151;
          stroke: none;
        }
        
        .ql-toolbar .ql-picker {
          color: #374151;
        }
        
        .ql-toolbar button:hover,
        .ql-toolbar button:focus {
          color: #1f2937;
        }
        
        .ql-toolbar button.ql-active {
          color: #3b82f6;
        }
        
        .ql-toolbar .ql-stroke.ql-active {
          stroke: #3b82f6;
        }
        
        .ql-toolbar .ql-fill.ql-active {
          fill: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;