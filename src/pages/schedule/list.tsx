import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Calendar, Clock, Box, Upload, Trash2 } from 'lucide-react';
import * as yaml from 'js-yaml';
import { CreateJobModal, type CreateJobData } from './components/create-job-modal';
import { createScheduledJob, deleteScheduledJob, fetchScheduledJobs, type ScheduledJobInfo } from '../../api/schedule';

export const ScheduleList: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [jobs, setJobs] = useState<ScheduledJobInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [importedJobData, setImportedJobData] = useState<CreateJobData | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Auto-dismiss notification after 3 seconds
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const loadJobs = useCallback(async () => {
        try {
            setJobs(await fetchScheduledJobs());
        } catch (error) {
            console.error('Failed to load scheduled jobs:', error);
            showNotification('error', 'Failed to load scheduled jobs.');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { loadJobs(); }, [loadJobs]);

    const handleCreateJob = async (data: CreateJobData) => {
        try {
            await createScheduledJob(data);
            showNotification('success', `Scheduled job "${data.name}" created.`);
            await loadJobs();
        } catch (error) {
            showNotification('error', `Failed to create job: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
    };

    const handleDeleteJob = async (job: ScheduledJobInfo) => {
        try {
            await deleteScheduledJob(job.appId);
            showNotification('success', `Deleted "${job.appName}".`);
            await loadJobs();
        } catch (error) {
            showNotification('error', `Failed to delete job: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDraggingOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);

        const files = e.dataTransfer.files;
        if (files.length === 0) return;

        const file = files[0];
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        // Validate file type
        if (!fileExt || !['json', 'yaml', 'yml'].includes(fileExt)) {
            showNotification('error', 'Invalid file type. Please drop a .json, .yaml, or .yml file.');
            return;
        }

        try {
            const fileContent = await file.text();
            let parsedData: any;

            // Parse based on file extension
            if (fileExt === 'json') {
                parsedData = JSON.parse(fileContent);
            } else {
                parsedData = yaml.load(fileContent);
            }

            // Validate required fields
            if (!parsedData || typeof parsedData !== 'object') {
                showNotification('error', 'Invalid file format. Expected an object with job configuration.');
                return;
            }

            let scheduleData: { name?: string; schedule?: string; image?: string; command?: string } = {};

            // Check if it's a full application format with component array
            if (parsedData.component && Array.isArray(parsedData.component) && parsedData.component.length > 0) {
                // Extract from component array (application format)
                const firstComponent = parsedData.component[0];

                if (firstComponent.type === 'scheduledjob' || firstComponent.type === 'job') {
                    scheduleData = {
                        name: firstComponent.name,
                        schedule: firstComponent.properties?.schedule || '',
                        image: firstComponent.image || firstComponent.properties?.image || '',
                        command: firstComponent.properties?.command
                            ? (Array.isArray(firstComponent.properties.command)
                                ? firstComponent.properties.command.join(' ')
                                : String(firstComponent.properties.command))
                            : '',
                    };
                } else {
                    showNotification('error', `Component type "${firstComponent.type}" is not a scheduled job. Expected "scheduledjob" or "job".`);
                    return;
                }
            } else {
                // Simple format - direct fields
                scheduleData = {
                    name: parsedData.name,
                    schedule: parsedData.schedule,
                    image: parsedData.image,
                    command: parsedData.command,
                };
            }

            // Validate extracted data
            const { name, schedule, image, command } = scheduleData;

            if (!name || !schedule || !image) {
                showNotification('error', 'Missing required fields. File must contain: name, schedule, and image.');
                return;
            }

            // Set imported data and open modal
            setImportedJobData({
                name: String(name),
                schedule: String(schedule),
                image: String(image),
                command: command ? String(command) : '',
            });
            setIsCreateModalOpen(true);
            showNotification('success', `Successfully imported job configuration from ${file.name}`);

        } catch (error) {
            console.error('File parsing error:', error);
            showNotification('error', `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, []);

    const handleModalClose = () => {
        setIsCreateModalOpen(false);
        // Clear imported data when modal closes
        setImportedJobData(null);
    };

    return (
        <div className="relative h-full">
            {/* Notification Toast */}
            {notification && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
                    <div className={`rounded-lg px-4 py-3 shadow-lg ${notification.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                        <p className="text-sm font-medium">{notification.message}</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-end mb-4">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                    <Plus className="h-3 w-3" />
                    Create Schedule
                </button>
            </div>

            {/* Schedules Content */}
            <div
                className="relative"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag Overlay */}
                {isDraggingOver && (
                    <div className="absolute inset-0 z-50 bg-blue-50/90 border-4 border-dashed border-blue-400 rounded-lg flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-blue-700">Drop JSON or YAML file here</p>
                            <p className="text-sm text-blue-600 mt-2">Supported formats: .json, .yaml, .yml</p>
                        </div>
                    </div>
                )}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="bg-white p-3 rounded-full mb-4 shadow-sm">
                            <Calendar className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">No scheduled jobs</h3>
                        <p className="text-xs text-gray-500 mb-4 max-w-xs text-center">
                            Create scheduled jobs to run tasks automatically at specific times.
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-500"
                        >
                            Create your first schedule
                        </button>
                        <p className="text-xs text-gray-400 mt-4">
                            or drag & drop a JSON/YAML file here
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {jobs.map((job) => (
                            <div
                                key={job.appId}
                                className="bg-white rounded-xl border border-gray-200 px-5 pt-5 pb-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-blue-100 group-hover:scale-110 transition-transform">
                                        <Clock className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteJob(job)}
                                        aria-label={`Delete ${job.appName}`}
                                        className="rounded-md p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mb-3">
                                    <h3 className="text-base font-semibold text-gray-900 mb-1">{job.appName}</h3>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md mb-2 w-fit">
                                        <code className="font-mono">{job.schedule}</code>
                                    </div>
                                    <p className="text-[11px] text-gray-400">
                                        component: {job.componentName} · ns: {job.appNamespace}
                                    </p>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-50 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Box className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-xs text-gray-500 line-clamp-1 flex-1" title={job.image}>
                                            {job.image}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Job Modal */}
            <CreateJobModal
                isOpen={isCreateModalOpen}
                onClose={handleModalClose}
                onSubmit={handleCreateJob}
                initialData={importedJobData}
            />
        </div>
    );
};
