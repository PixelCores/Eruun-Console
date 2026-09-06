import React from 'react';
import { Mail, Phone, Building, Calendar, MoreVertical } from 'lucide-react';
import type { Customer } from '../../../types/customer';
import { useLocale, useTranslations } from 'next-intl';

interface CustomerCardProps {
    customer: Customer;
    onEdit?: (customer: Customer) => void;
    onDelete?: (customer: Customer) => void;
}

const getStatusColor = (status: Customer['status']) => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'inactive':
            return 'bg-gray-100 text-gray-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onEdit, onDelete }) => {
    const t = useTranslations('Customers');
    const locale = useLocale();
    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // TODO: Implement dropdown menu
        console.log('Menu clicked for customer:', customer.id);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.(customer);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(customer);
    };

    // Suppress unused variable warnings for now
    void handleEdit;
    void handleDelete;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{customer.name}</h3>
                    {customer.company && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {customer.company}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(customer.status)}`}>
                        {t(customer.status)}
                    </span>
                    <button
                        onClick={handleMenuClick}
                        aria-label={t('customerMenu')}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{customer.email}</span>
                </div>

                {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                    </div>
                )}

                {customer.lastContact && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{t('lastContact', { date: new Date(customer.lastContact).toLocaleDateString(locale) })}</span>
                    </div>
                )}

                {customer.tags && customer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {customer.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500">
                    <span>{t('created', { date: new Date(customer.createdAt).toLocaleDateString(locale) })}</span>
                    <span>{t('updated', { date: new Date(customer.updatedAt).toLocaleDateString(locale) })}</span>
                </div>
            </div>
        </div>
    );
};
