export interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  lastContact?: string;
  tags?: string[];
}

export interface CustomerListResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CustomerFilters {
  search?: string;
  status?: string[];
  tags?: string[];
}