import React, { useState, useEffect } from 'react';
import { Project, ProjectService } from '../lib/projectService';

interface ProjectsSidebarProps {
  currentProject: Project | null;
  onSelectProject: (project: Project) => void;
  onNewQuote: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

type FilterStatus = 'all' | 'draft' | 'detecting' | 'editing' | 'quote_sent' | 'archived';
type FilterSource = 'all' | 'mls' | 'manual_upload' | 'customer_upload';

export default function ProjectsSidebar({
  currentProject,
  onSelectProject,
  onNewQuote,
  isOpen = false,
  onClose
}: ProjectsSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSource, setFilterSource] = useState<FilterSource>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const allProjects = await ProjectService.listUserProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      project.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.customerName?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;

    // Source filter
    const matchesSource = filterSource === 'all' || project.source === filterSource;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yest';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      detecting: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      editing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      quote_sent: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      archived: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    };
    return styles[status] || styles.draft;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'mls': return '🏠';
      case 'manual_upload': return '📤';
      case 'customer_upload': return '📩';
      default: return '📁';
    }
  };

  // Count projects by status
  const statusCounts = {
    all: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    detecting: projects.filter(p => p.status === 'detecting').length,
    editing: projects.filter(p => p.status === 'editing').length,
    quote_sent: projects.filter(p => p.status === 'quote_sent').length,
    archived: projects.filter(p => p.status === 'archived').length
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-80 bg-surface border-r border-gray-200 dark:border-gray-800 
        flex flex-col h-full shadow-xl shadow-black/5 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Header & New Quote */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800/50 bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Projects</h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
        <button
            onClick={() => {
              onNewQuote();
              if (onClose) onClose();
            }}
          className="w-full btn-primary py-3 font-semibold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group transform transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Quote</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pt-4 pb-2">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary placeholder:text-gray-400"
          />
          <svg
            className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
          {(['all', 'draft', 'editing', 'quote_sent'] as FilterStatus[]).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all border ${
                filterStatus === status
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
              <span className={`ml-1.5 opacity-80 ${filterStatus === status ? 'text-white' : 'text-gray-400'}`}>
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-xs text-gray-400 animate-pulse">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300 dark:text-gray-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-300">No projects found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredProjects.map(project => (
            <button
              key={project.id}
              onClick={() => {
                onSelectProject(project);
                if (onClose) onClose();
              }}
              className={`w-full p-3 text-left rounded-xl transition-all group relative overflow-hidden border ${
                currentProject?.id === project.id
                  ? 'bg-white dark:bg-gray-800 border-primary/30 shadow-md shadow-primary/5 ring-1 ring-primary/20'
                  : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-100 dark:hover:border-gray-700'
              }`}
            >
              {currentProject?.id === project.id && (
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full"></div>
              )}
              
              <div className="pl-2">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className={`text-sm font-semibold truncate transition-colors ${
                      currentProject?.id === project.id ? 'text-primary' : 'text-gray-900 dark:text-gray-100 group-hover:text-primary'
                    }`}>
                      {project.projectName || project.address || 'Untitled'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                    {formatDate(project.updatedAt)}
                  </span>
                </div>

                {project.address && project.projectName !== project.address && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2 pl-0.5">
                    {project.address}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border border-transparent ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {project.detections.length > 0 && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {project.detections.length}
                      </span>
                    )}
                    <span className="text-xs opacity-50 grayscale" title={`Source: ${project.source}`}>
                      {getSourceIcon(project.source)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
    </>
  );
}
