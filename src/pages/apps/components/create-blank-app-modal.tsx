import React, { useState } from 'react';
import Modal from '../../../components/base/Modal';
import Input from '../../../components/base/Input';
import Switch from '../../../components/base/switch';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface CreateBlankAppData {
    name: string;
    namespace: string;
    alias: string;
    version: string;
    project: string;
    description: string;
    icon: string;
    templateEnabled?: boolean;
}

interface CreateBlankAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateBlankAppData) => Promise<void>;
}

const FormField: React.FC<{
    label: string;
    required?: boolean;
    children: React.ReactNode;
    error?: string;
}> = ({ label, required, children, error }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

export const CreateBlankAppModal: React.FC<CreateBlankAppModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const t = useTranslations('Apps');
    const commonT = useTranslations('Common');
    const [formData, setFormData] = useState<CreateBlankAppData>({
        name: '',
        namespace: 'default',
        alias: '',
        version: '1.0.0',
        project: '',
        description: '',
        icon: '',
        templateEnabled: false,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof CreateBlankAppData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateName = (name: string): boolean => {
        // checkname validation: lowercase alphanumeric, may contain hyphens, must start/end with alphanumeric
        const nameRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
        return nameRegex.test(name) && name.length >= 2 && name.length <= 63;
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof CreateBlankAppData, string>> = {};

        if (!formData.name.trim()) {
            newErrors.name = t('nameRequired');
        } else if (!validateName(formData.name)) {
            newErrors.name = t('nameInvalid');
        }

        if (!formData.namespace.trim()) {
            newErrors.namespace = t('namespaceRequired');
        }

        if (!formData.project.trim()) {
            newErrors.project = t('projectRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: keyof CreateBlankAppData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value,
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            handleClose();
        } catch (error) {
            console.error('Failed to create app:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            namespace: 'default',
            alias: '',
            version: '1.0.0',
            project: '',
            description: '',
            icon: '',
            templateEnabled: false,
        });
        setErrors({});
        onClose();
    };

    return (
        <Modal
            isShow={isOpen}
            onClose={handleClose}
            title={t('createApp')}
            className="max-w-[520px]"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Two column grid for compact fields */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField label={t('name')} required error={errors.name}>
                        <Input
                            value={formData.name}
                            onChange={handleChange('name')}
                            placeholder="my-app"
                            className="w-full"
                        />
                    </FormField>

                    <FormField label={t('namespace')} required error={errors.namespace}>
                        <Input
                            value={formData.namespace}
                            onChange={handleChange('namespace')}
                            placeholder="default"
                            className="w-full"
                        />
                    </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label={t('alias')} error={errors.alias}>
                        <Input
                            value={formData.alias}
                            onChange={handleChange('alias')}
                            placeholder="My Application"
                            className="w-full"
                        />
                    </FormField>

                    <FormField label={t('project')} required error={errors.project}>
                        <Input
                            value={formData.project}
                            onChange={handleChange('project')}
                            placeholder="my-project"
                            className="w-full"
                        />
                    </FormField>
                </div>

	                <div className="grid grid-cols-2 gap-4">
	                    <FormField label={t('version')} error={errors.version}>
	                        <Input
	                            value={formData.version}
	                            onChange={handleChange('version')}
	                            placeholder="1.0.0"
	                            className="w-full"
	                        />
	                    </FormField>

	                    <FormField label={t('iconUrl')} error={errors.icon}>
	                        <Input
	                            value={formData.icon}
	                            onChange={handleChange('icon')}
	                            placeholder="https://example.com/icon.png"
	                            className="w-full"
	                        />
	                    </FormField>
	                </div>

	                <FormField label={t('description')}>
	                    <textarea
	                        value={formData.description}
                        onChange={handleChange('description')}
                        placeholder={t('descriptionPlaceholder')}
                        rows={3}
                        className="flex w-full rounded-md border border-components-panel-border bg-components-input-bg-normal px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-state-accent-solid disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                </FormField>

                {/* Temp Enable Toggle */}
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-sm font-medium text-gray-700">{t('temporaryEnable')}</p>
                        <p className="text-xs text-gray-500">{t('temporaryEnableDescription')}</p>
                    </div>
                    <Switch
                        checked={formData.templateEnabled || false}
                        onChange={(checked) => setFormData(prev => ({ ...prev, templateEnabled: checked }))}
                        size="md"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {commonT('cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? t('creating') : t('createApp')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
