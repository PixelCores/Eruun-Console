import { useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, type ButtonProps } from '../ui/Button';
import Input from './Input';
import { cn } from '../../utils/cn';

export type KeyValueItem = {
    id: string;
    key: string;
    value: string;
};

type DynamicKeyValueListProps = {
    title?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    btnText?: string;
    btnProps?: ButtonProps;
    initialItems?: KeyValueItem[];
    onItemsChange?: (items: KeyValueItem[]) => void;
    inputClassName?: string;
    deleteBtnClassName?: string;
    showEmptyState?: boolean;
    itemContainerClassName?: string;
};

const DynamicKeyValueList = ({
    title = 'Dynamic Key-Value List',
    keyPlaceholder = 'Name',
    valuePlaceholder = 'Value',
    btnText = 'Add New Item',
    btnProps,
    initialItems = [],
    onItemsChange,
    inputClassName,
    deleteBtnClassName,
    showEmptyState = true,
    itemContainerClassName,
}: DynamicKeyValueListProps) => {
    const [items, setItems] = useState<KeyValueItem[]>(initialItems);

    // Add new item
    const handleAdd = useCallback(() => {
        const newItem: KeyValueItem = {
            id: `item-${Date.now()}`,
            key: '',
            value: '',
        };
        const newItems = [...items, newItem];
        setItems(newItems);
        onItemsChange?.(newItems);
    }, [items, onItemsChange]);

    // Update item
    const handleChange = useCallback((id: string, field: 'key' | 'value', value: string) => {
        const newItems = items.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
        );
        setItems(newItems);
        onItemsChange?.(newItems);
    }, [items, onItemsChange]);

    // Remove item
    const handleRemove = useCallback((id: string) => {
        const newItems = items.filter((item) => item.id !== id);
        setItems(newItems);
        onItemsChange?.(newItems);
    }, [items, onItemsChange]);

    return (
        <div className="w-full">
            {/* Title (Optional) */}
            {title && (
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-text-secondary">{title}</span>
                    <span className="text-xs text-text-tertiary">{items.length} Items</span>
                </div>
            )}

            {/* Dynamic Element List */}
            <div className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={cn("bg-components-input-bg-normal rounded-lg p-3", itemContainerClassName)}
                    >
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                className={cn("flex-1", inputClassName)}
                                placeholder={keyPlaceholder}
                                value={item.key}
                                onChange={(e) => handleChange(item.id, 'key', e.target.value)}
                            />
                            <Input
                                type="text"
                                className={cn("flex-1", inputClassName)}
                                placeholder={valuePlaceholder}
                                value={item.value}
                                onChange={(e) => handleChange(item.id, 'value', e.target.value)}
                            />
                            <Button
                                variant="ghost"
                                size="small"
                                className={deleteBtnClassName}
                                onClick={() => handleRemove(item.id)}
                            >
                                <X className="h-4 w-4 text-text-tertiary" />
                            </Button>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {showEmptyState && items.length === 0 && (
                    <div className="bg-components-input-bg-normal rounded-lg p-4 text-center">
                        <div className="text-sm text-text-tertiary">
                            No content, click add button to create
                        </div>
                    </div>
                )}
            </div>

            {/* Add Button */}
            <Button
                variant="tertiary"
                size="medium"
                className="w-full mt-2"
                onClick={handleAdd}
                {...btnProps}
            >
                <div className="flex w-full items-center justify-center gap-1">
                    <Plus className="h-4 w-4" />
                    <span>{btnText}</span>
                </div>
            </Button>
        </div>
    );
};

export default DynamicKeyValueList;
