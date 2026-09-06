import type { CustomerListResponse, CustomerFilters } from '../types/customer';

export const fetchCustomers = async (
    page: number = 1,
    limit: number = 12,
    filters: CustomerFilters = {}
): Promise<CustomerListResponse> => {
    // Mock data for demonstration - replace with actual API call
    const mockCustomers = [
        {
            id: '1',
            name: 'John Smith',
            email: 'john.smith@example.com',
            company: 'Tech Corp',
            phone: '+1-555-123-4567',
            status: 'active' as const,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-11-20T14:15:00Z',
            lastContact: '2024-11-19T16:45:00Z',
            tags: ['premium', 'tech']
        },
        {
            id: '2',
            name: 'Sarah Johnson',
            email: 'sarah.j@business.com',
            company: 'Business Solutions Inc',
            phone: '+1-555-987-6543',
            status: 'active' as const,
            createdAt: '2024-02-20T09:15:00Z',
            updatedAt: '2024-11-21T11:30:00Z',
            lastContact: '2024-11-21T10:20:00Z',
            tags: ['enterprise', 'partner']
        },
        {
            id: '3',
            name: 'Michael Chen',
            email: 'mchen@startup.io',
            company: 'StartupIO',
            phone: '+1-555-456-7890',
            status: 'pending' as const,
            createdAt: '2024-03-10T14:20:00Z',
            updatedAt: '2024-11-18T09:45:00Z',
            lastContact: '2024-11-18T09:45:00Z',
            tags: ['startup', 'trial']
        },
        {
            id: '4',
            name: 'Emily Davis',
            email: 'emily.davis@consulting.com',
            company: 'Davis Consulting',
            phone: '+1-555-321-0987',
            status: 'inactive' as const,
            createdAt: '2024-01-05T11:00:00Z',
            updatedAt: '2024-10-15T16:30:00Z',
            lastContact: '2024-10-15T14:00:00Z',
            tags: ['consulting']
        },
        {
            id: '5',
            name: 'Robert Wilson',
            email: 'rwilson@manufacturing.co',
            company: 'Wilson Manufacturing',
            phone: '+1-555-654-3210',
            status: 'active' as const,
            createdAt: '2024-04-12T08:45:00Z',
            updatedAt: '2024-11-22T13:20:00Z',
            lastContact: '2024-11-22T13:20:00Z',
            tags: ['manufacturing', 'long-term']
        },
        {
            id: '6',
            name: 'Lisa Anderson',
            email: 'lisa.anderson@healthcare.org',
            company: 'City Healthcare',
            phone: '+1-555-789-0123',
            status: 'active' as const,
            createdAt: '2024-02-28T16:30:00Z',
            updatedAt: '2024-11-20T10:15:00Z',
            lastContact: '2024-11-20T10:15:00Z',
            tags: ['healthcare', 'government']
        }
    ];

    // Simulate filtering
    let filteredCustomers = [...mockCustomers];

    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(customer =>
            customer.name.toLowerCase().includes(searchLower) ||
            customer.email.toLowerCase().includes(searchLower) ||
            customer.company?.toLowerCase().includes(searchLower)
        );
    }

    if (filters.status && filters.status.length > 0) {
        filteredCustomers = filteredCustomers.filter(customer =>
            filters.status!.includes(customer.status)
        );
    }

    // Simulate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredCustomers.length;

    return {
        data: paginatedCustomers,
        total: filteredCustomers.length,
        page,
        limit,
        hasMore
    };
};