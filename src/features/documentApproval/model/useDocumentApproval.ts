import { useCallback } from 'react';
import { useTeamsContext } from '@/shared/lib/teams';

export const useDocumentApproval = (documentId: string) => {
  const teamsContext = useTeamsContext();

  const approve = useCallback(async () => {
    // Логика одобрения документа
    console.log('Approving document:', documentId);
  }, [documentId]);

  const reject = useCallback(async () => {
    // Логика отклонения документа
    console.log('Rejecting document:', documentId);
  }, [documentId]);

  return {
    approve,
    reject
  };
}; 