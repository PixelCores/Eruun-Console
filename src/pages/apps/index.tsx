import React from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useEducationInit } from '../../hooks/useEducationInit';
import { List } from './list';

export const Apps: React.FC = () => {
    useDocumentTitle('Apps - Eruun');
    useEducationInit();

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            <List />
        </div>
    );
};
