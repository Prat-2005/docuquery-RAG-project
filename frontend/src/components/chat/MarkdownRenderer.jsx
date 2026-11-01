import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // Split content by code blocks
  const parts = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'plaintext',
      value: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      value: content.substring(lastIndex),
    });
  }

  return (
    <div className="space-y-3 leading-relaxed">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={index}
              language={part.language}
              code={part.value}
            />
          );
        }
        return <TextBlock key={index} text={part.value} />;
      })}
    </div>
  );
};

const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-1.5 text-xs text-slate-400">
        <span className="font-mono uppercase">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2 py-1 transition hover:bg-slate-800 hover:text-slate-200"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-5">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const TextBlock = ({ text }) => {
  const paragraphs = text.split(/\n\n+/);

  return (
    <>
      {paragraphs.map((paragraph, pIndex) => {
        const lines = paragraph.split('\n');
        const isList = lines.every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim()));

        if (isList) {
          return (
            <ul key={pIndex} className="my-2 space-y-1.5 pl-5 list-disc marker:text-indigo-500">
              {lines.map((line, lIndex) => {
                const cleanLine = line.trim().replace(/^[-*]\s+|\d+\.\s+/, '');
                return <li key={lIndex}>{formatInlineText(cleanLine)}</li>;
              })}
            </ul>
          );
        }

        if (paragraph.startsWith('### ')) {
          return (
            <h4 key={pIndex} className="text-base font-bold text-slate-900 mt-4 mb-1">
              {formatInlineText(paragraph.replace('### ', ''))}
            </h4>
          );
        }
        if (paragraph.startsWith('## ')) {
          return (
            <h3 key={pIndex} className="text-lg font-bold text-slate-900 mt-4 mb-2">
              {formatInlineText(paragraph.replace('## ', ''))}
            </h3>
          );
        }
        if (paragraph.startsWith('# ')) {
          return (
            <h2 key={pIndex} className="text-xl font-extrabold text-slate-900 mt-5 mb-2">
              {formatInlineText(paragraph.replace('# ', ''))}
            </h2>
          );
        }

        return (
          <p key={pIndex} className="text-sm">
            {formatInlineText(paragraph)}
          </p>
        );
      })}
    </>
  );
};

const formatInlineText = (text) => {
  // Parses inline code `code`, bold **text**, and italic *text*
  const tokens = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={match.index}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-indigo-700 border border-slate-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={match.index} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={match.index} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens.length === 0 ? text : tokens;
};

export default MarkdownRenderer;
