import React, { useState, useEffect } from 'react';
import { Project, ProjectService } from '../lib/projectService';

interface ProjectsSidebarProps {
  currentProject: Project | null;
  onSelectProject: (project: Project) => void;
  onNewQuote: () => void;
}

type FilterStatus = 'all' | 'draft' | 'detecting' | 'editing' | 'quote_sent' | 'archived';
type FilterSource = 'all' | 'mls' | 'manual_upload' | 'customer_upload';

export default function ProjectsSidebar({
  currentProject,
  onSelectProject,
  onNewQuote
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

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      detecting: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      editing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      quote_sent: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      archived: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    };

    const labels = {
      draft: 'Draft',
      detecting: 'Detecting',
      editing: 'Editing',
      quote_sent: 'Sent',
      archived: 'Archived'
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${styles[status as keyof typeof styles] || styles.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'mls':
        return '🏠';
      case 'manual_upload':
        return '📤';
      case 'customer_upload':
        return '📩';
      default:
        return '📁';
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
    <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onNewQuote}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg py-3 px-4 font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Quote</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 block">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'draft', 'editing', 'quote_sent', 'archived'] as FilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')} ({statusCounts[status]})
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 block">
            Source
          </label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'mls', 'manual_upload', 'customer_upload'] as FilterSource[]).map(source => (
              <button
                key={source}
                onClick={() => setFilterSource(source)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  filterSource === source
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {source === 'all' ? 'All' : source.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchQuery || filterStatus !== 'all' || filterSource !== 'all'
                ? 'No projects match your filters'
                : 'No projects yet'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterSource === 'all' && (
              <button
                onClick={onNewQuote}
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create your first quote
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredProjects.map(project => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project)}
                className={`w-full p-4 text-left hover:bg-white dark:hover:bg-gray-800 transition-colors ${
                  currentProject?.id === project.id
                    ? 'bg-white dark:bg-gray-800 border-l-4 border-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getSourceIcon(project.source)}</span>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {project.projectName || project.address || 'Untitled'}
                      </h3>
                    </div>
                    {project.address && project.projectName !== project.address && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                        {project.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  {getStatusBadge(project.status)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(project.updatedAt)}
                  </span>
                </div>

                {project.detections.length > 0 && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {project.detections.length} items detected
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
