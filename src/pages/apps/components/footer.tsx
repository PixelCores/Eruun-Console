import React from 'react';
import { Github, MessageCircle, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="mt-12 border-t border-gray-200 pt-8 pb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                    © 2026 Eruun. Built with ❤️ for the community.
                </div>

                <div className="flex items-center gap-6">
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                    >
                        <Github className="w-4 h-4" />
                        <span>GitHub</span>
                    </a>
                    <a
                        href="https://discord.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>Community</span>
                    </a>
                    <a
                        href="https://docs.example.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>Docs</span>
                    </a>
                </div>
            </div>
        </footer>
    );
};
