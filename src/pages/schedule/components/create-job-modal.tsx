import React, { useState, useEffect } from 'react';
import Modal from '../../../components/base/Modal';

interface CreateJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateJobData) => void;
    initialData?: CreateJobData | null;
}

export interface CreateJobData {
    name: string;
    schedule: string;
    image: string;
    command: string;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [name, setName] = useState('');
    const [schedule, setSchedule] = useState('');
    const [image, setImage] = useState('');
    const [command, setCommand] = useState('');

    // Update form fields when initialData changes
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setSchedule(initialData.schedule || '');
            setImage(initialData.image || '');
            setCommand(initialData.command || '');
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, schedule, image, command });
        // Reset form
        setName('');
        setSchedule('');
        setImage('');
        setCommand('');
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal
            isShow={isOpen}
            onClose={handleClose}
            title="Create Schedule Job"
            className="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-3 border"
                        placeholder="job-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-1">
                        Schedule (Cron)
                    </label>
                    <input
                        type="text"
                        id="schedule"
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-3 border"
                        placeholder="*/5 * * * *"
                        value={schedule}
                        onChange={(e) => setSchedule(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">e.g. "*/5 * * * *" runs every 5 minutes</p>
                </div>

                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                        Image
                    </label>
                    <input
                        type="text"
                        id="image"
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-3 border"
                        placeholder="nginx:latest"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="command" className="block text-sm font-medium text-gray-700 mb-1">
                        Command
                    </label>
                    <input
                        type="text"
                        id="command"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-3 border"
                        placeholder='["/bin/sh", "-c", "date"]'
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                    />
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
                    >
                        Create
                    </button>
                    <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};
