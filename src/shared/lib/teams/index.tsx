// Re-export the new Teams integration from the main teams folder
export { TeamsProvider, useTeams, useTeamsOptional } from '../../../teams';
export type { TeamsContextType } from '../../../teams';

// Legacy alias for backward compatibility
export { useTeams as useTeamsContext } from '../../../teams'; 