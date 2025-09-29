/**
 * AuditEventsViewer - основной компонент для просмотра событий аудита
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Spinner,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem
} from '@fluentui/react-components';
import {
  Filter20Regular,
  ArrowDownload20Regular,
  ArrowSync20Regular,
  Search20Regular,
  MoreHorizontal20Regular,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Eye20Regular,
  Info20Regular
} from '@fluentui/react-icons';

import { auditApi } from '../../shared/api/auditApi';
import { 
  AuditEvent,
  AuditEventsQuery,
  AuditEventsResponse,
  AuditCategory,
  AuditSeverity 
} from '../../shared/types/audit';
import { notificationService } from '../../shared/lib/notifications';
import { AuditFilters } from './AuditFilters';
import { AuditEventDetails } from './AuditEventDetails';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    height: '100%'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: tokens.spacingVerticalS
  },

  headerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center'
  },

  filtersCard: {
    padding: tokens.spacingHorizontalM
  },

  tableContainer: {
    flex: 1,
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium
  },

  table: {
    minWidth: '100%'
  },

  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalS
  },

  paginationControls: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center'
  },

  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalL,
    gap: tokens.spacingHorizontalS
  },

  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: tokens.spacingVerticalXL,
    gap: tokens.spacingVerticalM
  },

  eventRow: {
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },

  eventMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },

  eventTimestamp: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  },

  eventUser: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold
  },

  eventDescription: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },

  eventAction: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold
  },

  eventSummary: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  },

  badgeContainer: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap'
  }
});

export interface AuditEventsViewerProps {
  defaultFilters?: Partial<AuditEventsQuery>;
  onEventSelect?: (event: AuditEvent) => void;
  compact?: boolean;
  height?: string;
}

export const AuditEventsViewer: React.FC<AuditEventsViewerProps> = ({
  defaultFilters = {},
  onEventSelect,
  compact = false,
  height = '600px'
}) => {
  const styles = useStyles();

  // State management
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters and pagination
  const [query, setQuery] = useState<AuditEventsQuery>({
    limit: 50,
    offset: 0,
    sortBy: 'timestamp',
    sortOrder: 'desc',
    ...defaultFilters
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load events
  useEffect(() => {
    loadEvents();
  }, [query]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: AuditEventsResponse = await auditApi.getEvents(query);
      
      setEvents(response.events);
      setTotal(response.total);
      setHasMore(response.hasMore);
    } catch (err: any) {
      console.error('Failed to load audit events:', err);
      setError(err.message || 'Не удалось загрузить события аудита');
      notificationService.error('Ошибка загрузки', err.message || 'Не удалось загрузить события аудита');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
    notificationService.success('Данные обновлены', 'События аудита успешно обновлены');
  };

  const handleFiltersChange = (newFilters: Partial<AuditEventsQuery>) => {
    setQuery(prev => ({
      ...prev,
      ...newFilters,
      offset: 0 // Reset pagination when filters change
    }));
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    const currentOffset = query.offset || 0;
    const limit = query.limit || 50;
    
    if (direction === 'next' && hasMore) {
      setQuery(prev => ({ ...prev, offset: currentOffset + limit }));
    } else if (direction === 'prev' && currentOffset > 0) {
      setQuery(prev => ({ ...prev, offset: Math.max(0, currentOffset - limit) }));
    }
  };

  const handleEventClick = (event: AuditEvent) => {
    setSelectedEvent(event);
    if (onEventSelect) {
      onEventSelect(event);
    }
  };

  const handleExportCSV = async () => {
    try {
      // Экспортируем текущие отфильтрованные события
      const exportQuery = { ...query, limit: 5000, offset: 0 }; // Ограничиваем экспорт
      const response = await auditApi.getEvents(exportQuery);
      
      const csv = auditApi.exportToCSV(response.events);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_events_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notificationService.success('Экспорт завершен', 'События аудита экспортированы в CSV');
    } catch (err: any) {
      console.error('Failed to export events:', err);
      notificationService.error('Ошибка экспорта', err.message || 'Не удалось экспортировать события');
    }
  };

  // Calculate pagination info
  const currentPage = Math.floor((query.offset || 0) / (query.limit || 50)) + 1;
  const totalPages = Math.ceil(total / (query.limit || 50));
  const startItem = (query.offset || 0) + 1;
  const endItem = Math.min(startItem + events.length - 1, total);

  if (loading && events.length === 0) {
    return (
      <div className={styles.loadingContainer} style={{ height }}>
        <Spinner size="medium" />
        <Text>Загрузка событий аудита...</Text>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ height }}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Text size={500} weight="semibold">События аудита</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginLeft: tokens.spacingHorizontalS }}>
            {total > 0 ? `${startItem}-${endItem} из ${total}` : 'Нет событий'}
          </Text>
        </div>
        <div className={styles.headerActions}>
          <Button
            appearance="subtle"
            icon={<Filter20Regular />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Скрыть фильтры' : 'Фильтры'}
          </Button>
          <Button
            appearance="subtle"
            icon={<ArrowSync20Regular />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Обновление...' : 'Обновить'}
          </Button>
          <Button
            appearance="subtle"
            icon={<ArrowDownload20Regular />}
            onClick={handleExportCSV}
            disabled={events.length === 0}
          >
            CSV
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Ошибка</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className={styles.filtersCard}>
          <AuditFilters
            query={query}
            onChange={handleFiltersChange}
            onReset={() => handleFiltersChange({
              startDate: undefined,
              endDate: undefined,
              categories: undefined,
              actions: undefined,
              userIds: undefined,
              searchText: undefined,
              onlySuccessful: undefined,
              onlyFailed: undefined
            })}
          />
        </Card>
      )}

      {/* Events Table */}
      {events.length === 0 && !loading ? (
        <div className={styles.noDataContainer}>
          <Info20Regular fontSize={48} color={tokens.colorNeutralForeground3} />
          <Text size={400} weight="semibold">Нет событий для отображения</Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
            Попробуйте изменить фильтры или временной период
          </Text>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <Table className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Время</TableHeaderCell>
                <TableHeaderCell>Пользователь</TableHeaderCell>
                <TableHeaderCell>Событие</TableHeaderCell>
                <TableHeaderCell>Категория</TableHeaderCell>
                <TableHeaderCell>Ресурс</TableHeaderCell>
                <TableHeaderCell>Статус</TableHeaderCell>
                <TableHeaderCell>Серьезность</TableHeaderCell>
                {!compact && <TableHeaderCell>Действия</TableHeaderCell>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow 
                  key={event.id}
                  className={styles.eventRow}
                  onClick={() => handleEventClick(event)}
                >
                  <TableCell>
                    <div className={styles.eventMeta}>
                      <Text className={styles.eventTimestamp}>
                        {auditApi.formatTimestamp(event.timestamp)}
                      </Text>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className={styles.eventMeta}>
                      <Text className={styles.eventUser}>{event.userName}</Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {event.userEmail}
                      </Text>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className={styles.eventDescription}>
                      <Text className={styles.eventAction}>{event.action}</Text>
                      <Text className={styles.eventSummary}>{event.description}</Text>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge color="informative" size="small">
                      {auditApi.formatCategory(event.category)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <Text size={300}>{event.resourceName || event.resourceId}</Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {event.resourceType}
                      </Text>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge color={auditApi.getSuccessColor(event.success)} size="small">
                      {event.success ? 'Успешно' : 'Ошибка'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge color={auditApi.getSeverityColor(event.severity)} size="small">
                      {auditApi.formatSeverity(event.severity)}
                    </Badge>
                  </TableCell>

                  {!compact && (
                    <TableCell>
                      <Menu>
                        <MenuTrigger>
                          <Button
                            appearance="subtle"
                            icon={<MoreHorizontal20Regular />}
                            size="small"
                          />
                        </MenuTrigger>
                        <MenuPopover>
                          <MenuList>
                            <MenuItem icon={<Eye20Regular />}>
                              Подробности
                            </MenuItem>
                          </MenuList>
                        </MenuPopover>
                      </Menu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {loading && (
            <div className={styles.loadingContainer}>
              <Spinner size="small" />
              <Text size={200}>Загрузка...</Text>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className={styles.paginationContainer}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            Страница {currentPage} из {totalPages} • Всего событий: {total}
          </Text>
          <div className={styles.paginationControls}>
            <Button
              appearance="subtle"
              icon={<ChevronLeft20Regular />}
              onClick={() => handlePageChange('prev')}
              disabled={(query.offset || 0) === 0}
              size="small"
            >
              Назад
            </Button>
            <Text size={200}>
              {currentPage} / {totalPages}
            </Text>
            <Button
              appearance="subtle"
              icon={<ChevronRight20Regular />}
              onClick={() => handlePageChange('next')}
              disabled={!hasMore}
              size="small"
            >
              Далее
            </Button>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <AuditEventDetails
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default AuditEventsViewer;
