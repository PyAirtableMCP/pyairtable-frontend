"use client"

import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "")
            const code = String(children).replace(/\n$/, "")
            const inline = !match
            
            return !inline ? (
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={() => copyToClipboard(code)}
                >
                  {copiedCode === code ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg"
                  {...props}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
                {...props}
              >
                {children}
              </code>
            )
          },
          pre({ children }) {
            return <div className="overflow-x-auto">{children}</div>
          },
          blockquote({ children }) {
            return (
              <blockquote className="mt-6 border-l-2 border-primary pl-6 italic">
                {children}
              </blockquote>
            )
          },
          table({ children }) {
            return (
              <div className="my-6 w-full overflow-y-auto">
                <table className="w-full">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return (
              <th className="border border-border px-4 py-2 text-left font-bold">
                {children}
              </th>
            )
          },
          td({ children }) {
            return (
              <td className="border border-border px-4 py-2">
                {children}
              </td>
            )
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                {children}
              </a>
            )
          },
          ul({ children }) {
            return <ul className="my-6 ml-6 list-disc">{children}</ul>
          },
          ol({ children }) {
            return <ol className="my-6 ml-6 list-decimal">{children}</ol>
          },
          li({ children }) {
            return <li className="mt-2">{children}</li>
          },
          h1({ children }) {
            return (
              <h1 className="mt-8 mb-4 text-3xl font-bold tracking-tight">
                {children}
              </h1>
            )
          },
          h2({ children }) {
            return (
              <h2 className="mt-6 mb-3 text-2xl font-semibold tracking-tight">
                {children}
              </h2>
            )
          },
          h3({ children }) {
            return (
              <h3 className="mt-4 mb-2 text-xl font-semibold tracking-tight">
                {children}
              </h3>
            )
          },
          p({ children }) {
            return <p className="leading-7 [&:not(:first-child)]:mt-4">{children}</p>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}