import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, ExternalLink, ChevronRight, ChevronDown } from 'lucide-react';

interface APIDocsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TOCItem {
    id: string;
    title: string;
    level: number;
}

interface TOCSection {
    title: string;
    items: TOCItem[];
    expanded: boolean;
}

// Parse markdown content to extract table of contents grouped by sections
const extractTOC = (markdown: string): TOCSection[] => {
    const lines = markdown.split('\n');
    const sections: TOCSection[] = [];
    let currentSection: TOCSection | null = null;

    lines.forEach((line) => {
        const h1Match = line.match(/^# (.+)$/);
        const h2Match = line.match(/^## (.+)$/);
        const h3Match = line.match(/^#{3,4} (.+)$/);

        if (h1Match) {
            const title = h1Match[1].replace(/\*\*/g, '').trim();
            currentSection = { title, items: [], expanded: true };
            sections.push(currentSection);
        } else if (h2Match && currentSection) {
            const title = h2Match[1].replace(/\*\*/g, '').trim();
            const id = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
            currentSection.items.push({ id, title, level: 2 });
        } else if (h3Match && currentSection) {
            const title = h3Match[1].replace(/\*\*/g, '').trim();
            const id = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
            currentSection.items.push({ id, title, level: 3 });
        }
    });

    return sections;
};

// Simple markdown to HTML converter
const markdownToHtml = (markdown: string): string => {
    return markdown
        // Code blocks with language
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
            `<pre class="code-block"><code class="language-${lang || 'text'}">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
        // Headers with IDs
        .replace(/^##### (.+)$/gm, (_, text) => {
            const id = text.replace(/\*\*/g, '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
            return `<h5 id="${id}" class="doc-h5">${text}</h5>`;
        })
        .replace(/^#### (.+)$/gm, (_, text) => {
            const id = text.replace(/\*\*/g, '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
            return `<h4 id="${id}" class="doc-h4">${text}</h4>`;
        })
        .replace(/^### (.+)$/gm, (_, text) => {
            const id = text.replace(/\*\*/g, '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
            return `<h3 id="${id}" class="doc-h3">${text}</h3>`;
        })
        .replace(/^## (.+)$/gm, (_, text) => {
            const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
            return `<h2 id="${id}" class="doc-h2">${text}</h2>`;
        })
        .replace(/^# (.+)$/gm, (_, text) => {
            const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
            return `<h1 id="${id}" class="doc-h1">${text}</h1>`;
        })
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Task lists
        .replace(/^- \[x\] (.+)$/gm, '<div class="task-item completed">✓ $1</div>')
        .replace(/^- \[ \] (.+)$/gm, '<div class="task-item">○ $1</div>')
        // Unordered lists
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        // Paragraphs (lines not starting with special chars)
        .replace(/^(?!<[hpulod]|```|\s*$)(.+)$/gm, '<p>$1</p>')
        // Wrap consecutive li elements
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
};

export const APIDocsModal: React.FC<APIDocsModalProps> = ({ isOpen, onClose }) => {
    const [markdown, setMarkdown] = useState<string>('');
    const [sections, setSections] = useState<TOCSection[]>([]);
    const [activeSection, setActiveSection] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            fetch('/workflow-testing-guide.md')
                .then(res => res.text())
                .then(text => {
                    setMarkdown(text);
                    const toc = extractTOC(text);
                    setSections(toc);
                    // Expand first few sections by default
                    setExpandedSections(new Set(toc.slice(0, 3).map(s => s.title)));
                    setLoading(false);
                })
                .catch(() => {
                    setMarkdown('# Error\n\nFailed to load documentation.');
                    setLoading(false);
                });
        }
    }, [isOpen]);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const toggleSection = (title: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(title)) {
                next.delete(title);
            } else {
                next.add(title);
            }
            return next;
        });
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all flex" style={{ height: '90vh' }}>
                                {/* Left Sidebar - Navigation */}
                                <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
                                    <div className="px-4 py-4 border-b border-gray-100">
                                        <h3 className="text-sm font-semibold text-gray-900">目录</h3>
                                    </div>
                                    <nav className="flex-1 overflow-y-auto py-2">
                                        {sections.map((section) => (
                                            <div key={section.title}>
                                                <button
                                                    onClick={() => toggleSection(section.title)}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    {expandedSections.has(section.title) ? (
                                                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                                    ) : (
                                                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                                    )}
                                                    <span className="truncate">{section.title}</span>
                                                </button>
                                                {expandedSections.has(section.title) && (
                                                    <div className="ml-4">
                                                        {section.items.map((item) => (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => scrollToSection(item.id)}
                                                                className={`w-full text-left px-4 py-1.5 text-xs transition-colors ${activeSection === item.id
                                                                    ? 'text-blue-600 bg-blue-50'
                                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                                    }`}
                                                                style={{ paddingLeft: `${(item.level - 1) * 8 + 16}px` }}
                                                            >
                                                                <span className="flex items-center gap-1">
                                                                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                                                    <span className="truncate">{item.title}</span>
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </nav>
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
                                        <Dialog.Title className="text-base font-semibold text-gray-900">
                                            API Documentation
                                        </Dialog.Title>
                                        <div className="flex items-center gap-3">
                                            <a
                                                href="https://api.slfy.ai/v1"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                API 测试
                                            </a>
                                            <button
                                                onClick={onClose}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1 overflow-y-auto">
                                        {loading ? (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                                            </div>
                                        ) : (
                                            <div className="px-8 py-6">
                                                <div
                                                    className="api-docs-content prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>

                {/* Styles */}
                <style>{`
                    .api-docs-content .doc-h1 {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #111827;
                        margin: 2rem 0 1rem;
                        padding-bottom: 0.75rem;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .api-docs-content .doc-h2 {
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #1f2937;
                        margin: 1.5rem 0 0.75rem;
                    }
                    .api-docs-content .doc-h3 {
                        font-size: 1rem;
                        font-weight: 600;
                        color: #374151;
                        margin: 1.25rem 0 0.5rem;
                    }
                    .api-docs-content .doc-h4,
                    .api-docs-content .doc-h5 {
                        font-size: 0.875rem;
                        font-weight: 600;
                        color: #4b5563;
                        margin: 1rem 0 0.5rem;
                    }
                    .api-docs-content .code-block {
                        background: #f8fafc;
                        border-radius: 8px;
                        padding: 1rem;
                        overflow-x: auto;
                        margin: 1rem 0;
                        border: 1px solid #e2e8f0;
                    }
                    .api-docs-content .code-block code {
                        color: #334155;
                        font-size: 0.8rem;
                        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                        line-height: 1.5;
                    }
                    .api-docs-content .inline-code {
                        background: #f1f5f9;
                        padding: 0.125rem 0.375rem;
                        border-radius: 4px;
                        font-size: 0.8125rem;
                        color: #0369a1;
                        font-family: ui-monospace, monospace;
                    }
                    .api-docs-content p {
                        color: #4b5563;
                        line-height: 1.7;
                        margin: 0.5rem 0;
                        font-size: 0.875rem;
                    }
                    .api-docs-content ul {
                        list-style-type: disc;
                        padding-left: 1.5rem;
                        margin: 0.5rem 0;
                    }
                    .api-docs-content li {
                        color: #4b5563;
                        margin: 0.25rem 0;
                        font-size: 0.875rem;
                    }
                    .api-docs-content .task-item {
                        padding: 0.25rem 0;
                        color: #4b5563;
                        font-size: 0.875rem;
                    }
                    .api-docs-content .task-item.completed {
                        color: #059669;
                    }
                `}</style>
            </Dialog>
        </Transition>
    );
};
