import React, { useState } from 'react';
import MusicaList from './MusicaList';
import TelevisionList from './TelevisionList';

const MusicaTelevisionView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'musica' | 'television'>('musica');

    return (
        <div className="content-card p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Tabs Header */}
            <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('musica')}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors bg-transparent
                                ${activeTab === 'musica'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18V5l12-2v13"></path>
                                    <circle cx="6" cy="18" r="3"></circle>
                                    <circle cx="18" cy="16" r="3"></circle>
                                </svg>
                                Música
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('television')}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors bg-transparent
                                ${activeTab === 'television'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                                    <polyline points="17 2 12 7 7 2"></polyline>
                                </svg>
                                Televisión
                            </div>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'musica' && <MusicaList />}
                {activeTab === 'television' && <TelevisionList />}
            </div>
        </div>
    );
};

export default MusicaTelevisionView;
