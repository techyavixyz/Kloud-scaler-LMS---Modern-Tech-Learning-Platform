import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Eye, Clock, Tag, ArrowLeft, Copy, Check, ExternalLink, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';

interface Tool {
  _id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  category: string;
  tags: string[];
  author: { username: string };
  createdAt: string;
  views: number;
  thumbnail: string;
  type: 'link' | 'code' | 'file' | 'text';
  githubLink?: string;
  downloadLink?: string;
  externalLink?: string;
}

interface RelatedTool {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  createdAt: string;
  author: { username: string };
}

const ToolDetailPage = () => {
  const { slug } = useParams();
  const [tool, setTool] = useState<Tool | null>(null);
  const [relatedTools, setRelatedTools] = useState<RelatedTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadTool();
    }
  }, [slug]);

  const loadTool = async () => {
    try {
      setIsLoading(true);
      const [toolRes, relatedRes] = await Promise.all([
        axios.get(`http://localhost:3001/api/tools/${slug}`),
        axios.get(`http://localhost:3001/api/tools/${slug}/related`)
      ]);
      
      setTool(toolRes.data);
      setRelatedTools(relatedRes.data);
    } catch (error) {
      console.error('Error loading tool:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');
    const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

    if (!inline && match) {
      return (
        <div className="relative group">
          <button
            onClick={() => copyToClipboard(code, codeId)}
            className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
            title="Copy code"
          >
            {copiedCode === codeId ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4 text-gray-300" />
            )}
          </button>
          <SyntaxHighlighter
            style={tomorrow}
            language={language}
            PreTag="div"
            className="rounded-lg"
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <code className="bg-gray-800 text-cyan-300 px-2 py-1 rounded text-sm" {...props}>
        {children}
      </code>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading tool...</div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Tool not found</div>
          <Link
            to="/tools"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Back to Tools
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/tools"
          className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tools</span>
        </Link>

        {/* Tool Header */}
        <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="relative">
            <img
              src={tool.thumbnail}
              alt={tool.title}
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-cyan-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {tool.category}
                </span>
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {tool.type}
                </span>
                {tool.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/20 text-white px-2 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {tool.title}
              </h1>
              <div className="flex items-center space-x-6 text-white/80 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{tool.author.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(tool.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>{tool.views} views</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-wrap gap-4">
              {tool.githubLink && (
                <a
                  href={tool.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>View on GitHub</span>
                </a>
              )}
              {tool.downloadLink && (
                <a
                  href={tool.downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>
              )}
              {tool.externalLink && (
                <a
                  href={tool.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Tool</span>
                </a>
              )}
            </div>
          </div>

          {/* Tool Content */}
          <div className="p-8">
            <div className="prose prose-invert prose-cyan max-w-none">
              <ReactMarkdown
                components={{
                  code: CodeBlock,
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-white mb-6 mt-8">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-white mb-4 mt-6">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-bold text-white mb-3 mt-5">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-gray-300 mb-4 space-y-2 list-disc list-inside">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-gray-300 mb-4 space-y-2 list-decimal list-inside">{children}</ol>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-cyan-500 pl-4 py-2 bg-cyan-500/10 rounded-r-lg mb-4 text-gray-300 italic">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {tool.content}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex items-center space-x-2 mb-4">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Related Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedTools.map((relatedTool) => (
                <Link
                  key={relatedTool._id}
                  to={`/tools/${relatedTool.slug}`}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-cyan-500/50"
                >
                  <img
                    src={relatedTool.thumbnail}
                    alt={relatedTool.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-2 group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {relatedTool.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                      {relatedTool.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      By {relatedTool.author.username} • {new Date(relatedTool.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolDetailPage;