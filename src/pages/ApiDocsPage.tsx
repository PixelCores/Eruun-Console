import React, { useCallback, useEffect, useState } from 'react';
import { Play, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Section {
    id: string;
    title: string;
    level: number;
    content: string; // The HTML/Markdown content for the left column
    codeBlocks: string[]; // The code blocks for the right column
}

const ApiDocsPage: React.FC = () => {
    const t = useTranslations('ApiDocs');
    const [sections, setSections] = useState<Section[]>([]);
    const [activeSection, setActiveSection] = useState<string>('');
    const [selectedLang, setSelectedLang] = useState<'curl' | 'python' | 'javascript'>('curl');

    const parseMarkdown = useCallback((text: string) => {
        const lines = text.split('\n');
        const parsedSections: Section[] = [];
        let currentSection: Section | null = null;
        let currentCodeBlock = '';
        let insideCodeBlock = false;

        // Custom parser to split content and code
        // Logic: H1 starts new section. H2/H3 are part of H1 section content. Code blocks attach to current section.

        // Initial section
        currentSection = {
            id: 'intro',
            title: t('introduction'),
            level: 1,
            content: '',
            codeBlocks: [] // Intro usually has no code
        };
        parsedSections.push(currentSection);

        lines.forEach(line => {
            const h1Match = line.match(/^# (.+)$/);
            const h2Match = line.match(/^## (.+)$/);
            const h3Match = line.match(/^### (.+)$/);

            // Only split on H1
            if (h1Match) {
                const title = h1Match[1];
                const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                currentSection = {
                    id,
                    title,
                    level: 1,
                    content: `<h1>${title}</h1>`,
                    codeBlocks: []
                };
                parsedSections.push(currentSection);
            } else if (line.trim().startsWith('```')) {
                if (insideCodeBlock) {
                    // End of code block
                    currentCodeBlock += line + '\n';
                    if (currentSection) {
                        currentSection.codeBlocks.push(currentCodeBlock);
                    }
                    currentCodeBlock = '';
                    insideCodeBlock = false;
                } else {
                    // Start of code block
                    insideCodeBlock = true;
                    // Preserve language tag
                    currentCodeBlock += line + '\n';
                }
            } else {
                if (insideCodeBlock) {
                    currentCodeBlock += line + '\n';
                } else {
                    // Treat as content
                    let processedLine = line
                        .replace(/<div class="method-badge get">GET<\/div>/g, '<span class="badge get">GET</span>')
                        .replace(/<div class="param-row">/g, '<div class="param-row">')
                        .replace(/<\/div>/g, '</div>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

                    if (h2Match) {
                        processedLine = `<h2>${h2Match[1]}</h2>`;
                    } else if (h3Match) {
                        processedLine = `<h3>${h3Match[1]}</h3>`;
                    }

                    if (currentSection) {
                        currentSection.content += processedLine + '\n';
                    }
                }
            }
        });

        // Filter out empty sections
        const validSections = parsedSections.filter(s => s.content.trim() !== '' || s.codeBlocks.length > 0);
        setSections(validSections);

        // Set active section to the first valid one (skipping intro if it's empty/dummy)
        if (validSections.length > 1) {
            setActiveSection(validSections[1].id);
        } else if (validSections.length > 0) {
            setActiveSection(validSections[0].id);
        }
    }, [t]);

    useEffect(() => {
        fetch('/api-docs-data.md')
            .then(res => res.text())
            .then(text => {
                parseMarkdown(text);
            });
    }, [parseMarkdown]);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(`section-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="flex h-full min-h-0 bg-white font-sans">
            {/* Left Sidebar - Navigation */}
            <div className="sticky top-0 z-10 flex h-full w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                    <img src="/logo_icon.svg" alt={t('logo')} className="w-8 h-8" />
                    <span className="font-semibold text-gray-900">Eruun Console</span>
                </div>

                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-gray-400 border border-gray-200 px-1.5 rounded">⌘K</span>
                    </div>
                </div>

                <div className="p-3">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg mb-4">
                        <span className="text-blue-600">&lt;/&gt;</span>
                        <span>{t('title')}</span>
                    </button>

                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider">{t('chatbot')}</div>
                        <div className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">{t('conversations')}</div>
                        <div className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">{t('fileUpload')}</div>

                        <div className="text-xs font-semibold text-gray-400 px-3 py-2 mt-4 uppercase tracking-wider">{t('knowledgeBase')}</div>
                        {sections.map(section => (
                            section.level === 1 && section.id !== 'intro' && (
                                <div
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center gap-2 ${activeSection === section.id ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${activeSection === section.id ? 'bg-blue-600' : 'bg-transparent'}`}></span>
                                    {section.title}
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area - Split View */}
            <div className="flex-1 flex min-w-0">
                <div className="flex-1 max-w-5xl mx-auto w-full flex">
                    {/* Middle Column - Text Content */}
                    <div className="flex-1 px-12 py-10 min-w-0 overflow-y-auto pb-40">
                        {sections.map(section => (
                            <div key={section.id} id={`section-${section.id}`} className="mb-16 scroll-mt-10">
                                {/* Title with Method Badge */}
                                <div className="prose prose-slate max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: section.content }} />


                                    {/* Try It Button if it's an endpoint */}
                                    {section.content.includes('GET') && (
                                        <div className="mt-6 mb-8 bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">GET</span>
                                                    <span className="font-mono text-sm text-gray-700 font-medium">/datasets</span>
                                                </div>
                                                <button className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:shadow-lg group">
                                                    {t('tryIt')}
                                                    <Play className="w-3.5 h-3.5 fill-current group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Column - Code Examples */}
                    <div className="sticky top-0 hidden h-full w-[420px] overflow-y-auto border-l border-gray-200 bg-white py-6 pr-5 pl-6 lg:block">
                        <div className="sticky top-6 space-y-6">
                            {sections.find(s => s.id === activeSection)?.codeBlocks.map((code, idx) => {
                                const isCurl = code.trim().includes('curl');
                                // Clean code first before HTML escaping
                                const cleanCode = code
                                    .replace(/```\w*\n?/, '')
                                    .replace(/```$/, '')
                                    .trim();

                                // Syntax highlighting without breaking HTML
                                const highlightCode = (codeStr: string) => {
                                    return codeStr
                                        .replace(/&/g, "&amp;")
                                        .replace(/</g, "&lt;")
                                        .replace(/>/g, "&gt;")
                                        // Highlight strings (must come before keywords to avoid conflicts)
                                        .replace(/"([^"]+)"/g, '<span style="color: #059669">"$1"</span>')
                                        // Highlight boolean and null keywords
                                        .replace(/\b(true|false|null)\b/g, '<span style="color: #3b82f6">$1</span>')
                                        // Highlight curl keywords
                                        .replace(/\b(curl|GET|POST|PUT|DELETE|PATCH)\b/g, '<span style="color: #8b5cf6; font-weight: 600">$1</span>')
                                        .replace(/(--request|--url|--header|--data)/g, '<span style="color: #a855f7">$1</span>')
                                        // Highlight numbers (IMPORTANT: only in JSON context, not in URLs or headers)
                                        .replace(/:\s*(\d+)/g, ': <span style="color: #f59e0b">$1</span>')
                                        .replace(/\[(\d+)\]/g, '[<span style="color: #f59e0b">$1</span>]');
                                };

                                return (
                                    <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
                                        {/* Language Selector Tabs */}
                                        {isCurl && (
                                            <div className="px-4 pt-3 pb-0 bg-white border-b border-gray-100">
                                                <div className="flex gap-1 -mb-px">
                                                    {(['curl', 'python', 'javascript'] as const).map((lang) => (
                                                        <button
                                                            key={lang}
                                                            onClick={() => setSelectedLang(lang)}
                                                            className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-all ${selectedLang === lang
                                                                ? 'bg-gray-50 text-gray-900 border-t border-l border-r border-gray-200'
                                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                                                                }`}
                                                        >
                                                            {lang === 'curl' ? 'cURL' : lang === 'python' ? 'Python' : 'JavaScript'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className={`px-4 py-2.5 ${isCurl ? 'bg-white' : 'bg-white'} flex justify-between items-center`}>
                                            <div className="flex items-center gap-2">
                                                {isCurl ? (
                                                    <span className="font-medium text-gray-700 text-xs">{t('request')}</span>
                                                ) : (
                                                    <span className="font-semibold text-emerald-600 text-sm flex items-center gap-1.5">
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                                        200 OK
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-1 hover:bg-gray-100 rounded transition-colors" title={t('copyCode')} aria-label={t('copyCode')}>
                                                    <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-gray-800 bg-white" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            <code dangerouslySetInnerHTML={{ __html: highlightCode(cleanCode) }} />
                                        </pre>
                                    </div>
                                );
                            }) || (
                                    <div className="text-sm text-gray-400 text-center mt-20">
                                        {t('selectExample')}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .badge {
                    display: inline-block;
                    padding: 0.125rem 0.5rem;
                    border-radius: 0.375rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    margin-right: 0.5rem;
                    letter-spacing: 0.025em;
                }
                .badge.get {
                    background-color: #d1fae5;
                    color: #065f46;
                    border: 1px solid #a7f3d0;
                }
                .param-row {
                    display: flex;
                    align-items: baseline;
                    gap: 0.875rem;
                    margin-bottom: 0.75rem;
                    padding: 0.5rem 0;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 0.875rem;
                    transition: background-color 0.15s;
                }
                .param-row:hover {
                    background-color: #fafafa;
                }
                .param-name {
                    color: #1e40af;
                    font-weight: 600;
                }
                .param-type {
                    color: #6b7280;
                    font-size: 0.75rem;
                    background: #f3f4f6;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                }
                .param-required {
                    color: #dc2626;
                    font-size: 0.75rem;
                    background: #fef2f2;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    border: 1px solid #fecaca;
                }
                .param-location {
                    color: #b45309;
                    font-size: 0.75rem;
                    background: #fef3c7;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                }
                .param-default {
                    color: #6b7280;
                    font-size: 0.75rem;
                    background: #f9fafb;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    border: 1px solid #e5e7eb;
                }
                .inline-code {
                    background: #f3f4f6;
                    color: #1e293b;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-size: 0.875em;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    border: 1px solid #e5e7eb;
                }
                h1 { 
                    font-size: 2rem; 
                    font-weight: 700; 
                    color: #0f172a; 
                    margin-bottom: 1.25rem;
                    letter-spacing: -0.025em;
                }
                h2 { 
                    font-size: 1.375rem; 
                    font-weight: 600; 
                    color: #0f172a; 
                    margin-top: 3rem; 
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #f3f4f6;
                }
                h3 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin-top: 2rem;
                    margin-bottom: 0.75rem;
                }
                p { 
                    color: #475569; 
                    line-height: 1.75; 
                    margin-bottom: 1rem; 
                }
            `}</style>
        </div>
    );
};

export default ApiDocsPage;
