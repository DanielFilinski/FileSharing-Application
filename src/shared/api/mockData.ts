// Mock данные для разработки без API сервера
export const mockDocuments = [
  {
    id: 'mock-1',
    key: 'mock-1',
    name: 'Tax Return 2024.pdf',
    modified: '2 days ago',
    createdBy: 'John Smith',
    modifiedBy: 'Jane Doe',
    owner: 'me' as const,
    shared: false,
    status: 'Active' as const,
    lock: false,
    clientEmail: 'john.smith@company.com',
    documentType: 'tax',
    documentSubtype: 'income_tax',
    period: 'year',
    description: 'Annual tax return documents'
  },
  {
    id: 'mock-2',
    key: 'mock-2',
    name: 'Audit Report Q1.docx',
    modified: '1 week ago',
    createdBy: 'Alice Johnson',
    modifiedBy: 'Bob Wilson',
    owner: 'other' as const,
    shared: true,
    status: 'pending validation' as const,
    lock: false,
    clientEmail: 'alice.johnson@client.com',
    documentType: 'audit',
    documentSubtype: 'financial_audit',
    period: 'quarter',
    description: 'Q1 financial audit report'
  },
  {
    id: 'mock-3',
    key: 'mock-3',
    name: 'Consulting Agreement.pdf',
    modified: '3 days ago',
    createdBy: 'Mike Brown',
    modifiedBy: 'Sarah Davis',
    owner: 'me' as const,
    shared: false,
    status: 'validation in process' as const,
    lock: true,
    clientEmail: 'mike.brown@enterprise.com',
    documentType: 'consulting',
    documentSubtype: 'business_consulting',
    period: 'one_time',
    description: 'Business consulting agreement'
  }
];

export const mockApiResponse = <T>(data: T, delay: number = 500): Promise<{ data: T; status: number }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data,
        status: 200
      });
    }, delay);
  });
};
