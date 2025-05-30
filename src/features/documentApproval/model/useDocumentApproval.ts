import { useCallback } from 'react';
import { useTeamsContext } from '@/shared/lib/teams';


export const useDocumentApproval = (documentId: string) => {
  const teamsContext = useTeamsContext();

  const approve = useCallback(async () => {
    try {
      // Здесь будет логика утверждения документа
      console.log('Document approved:', documentId);
    } catch (error) {
      console.error('Error approving document:', error);
    }
  }, [documentId]);

  const reject = useCallback(async () => {
    try {
      // Здесь будет логика отклонения документа
      console.log('Document rejected:', documentId);
    } catch (error) {
      console.error('Error rejecting document:', error);
    }
  }, [documentId]);

  return {
    approve,
    reject
  };
}; 