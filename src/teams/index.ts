// Teams Integration Components
export { TeamsProvider, useTeams, useTeamsOptional } from './TeamsProvider';
export { TeamsTab } from './TeamsTab';
export { TeamsTabConfig } from './TeamsTabConfig';

// Types
export type { TeamsContextType } from './TeamsProvider';

// Re-export Teams SDK types for convenience
export type {
  Context as TeamsContext,
  TeamInfo,
  ChannelInfo,
  UserInfo
} from '@microsoft/teams-js';
