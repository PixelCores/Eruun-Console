import { useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, type ButtonProps } from '../ui/Button';
import Input from './Input';
import { cn } from '../../utils/cn';

export type InputItem = {
    id: string;
    value: string;
    placeholder?: string;
};

type DynamicInputListProps = {
    title?: string;
    placeholder?: string;
    btnText?: string;
    btnProps?: ButtonProps;
    initialItems?: InputItem[];
    onItemsChange?: (items: InputItem[]) => void;
    inputType?: React.HTMLInputTypeAttribute;
    inputClassName?: string;
    deleteBtnClassName?: string;
    showEmptyState?: boolean;
    itemContainerClassName?: string;
};

const DynamicInputList = ({
    title = 'Dynamic Input List',
    placeholder = 'Enter content',
    btnText = 'Add New Item',
    btnProps,
    initialItems = [],
    onItemsChange,
    inputType = 'text',
    inputClassName,
    deleteBtnClassName,
    showEmptyState = true,
    itemContainerClassName,
}: DynamicInputListProps) => {
    const [items, setItems] = useState<InputItem[]>(initialItems);

    // Add new item
    const handleAdd = useCallback(() => {
        const newItem: InputItem = {
            id: `item-${Date.now()}`,
            value: '',
            placeholder,
        };
        const newItems = [...items, newItem];
        setItems(newItems);
        onItemsChange?.(newItems);
    }, [items, placeholder, onItemsChange]);

    // Update item
    const handleChange = useCallback((id: string, value: string) => {
        const newItems = items.map((item) =>
            item.id === id ? { ...item, value } : item
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
                                type={inputType}
                                className={cn("flex-1", inputClassName)}
                                placeholder={item.placeholder}
                                value={item.value}
                                onChange={(e) => handleChange(item.id, e.target.value)}
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

export default DynamicInputList;
