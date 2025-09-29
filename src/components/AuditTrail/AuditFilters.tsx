/**
 * AuditFilters - компонент для фильтрации событий аудита
 */

import React, { useState, useEffect } from 'react';
import {
  Field,
  Input,
  Dropdown,
  Option,
  Button,
  Checkbox,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  CalendarRegular,
  SearchRegular,
  DismissRegular
} from '@fluentui/react-icons';

import { 
  AuditEventsQuery,
  AuditCategory,
  AuditSeverity 
} from '../../shared/types/audit';
import { auditApi } from '../../shared/api/auditApi';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },

  filtersRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
    alignItems: 'end'
  },

  searchRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'end'
  },

  checkboxRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    alignItems: 'center',
    flexWrap: 'wrap'
  },

  quickFilters: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    alignItems: 'center'
  },

  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});

export interface AuditFiltersProps {
  query: AuditEventsQuery;
  onChange: (filters: Partial<AuditEventsQuery>) => void;
  onReset: () => void;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({
  query,
  onChange,
  onReset
}) => {
  const styles = useStyles();

  // Local state for form inputs
  const [searchText, setSearchText] = useState(query.searchText || '');
  const [startDate, setStartDate] = useState(
    query.startDate ? new Date(query.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    query.endDate ? new Date(query.endDate).toISOString().split('T')[0] : ''
  );

  // Apply search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== query.searchText) {
        onChange({ searchText: searchText || undefined });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText, query.searchText, onChange]);

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    if (field === 'startDate') {
      setStartDate(value);
      onChange({ startDate: value ? new Date(value).toISOString() : undefined });
    } else {
      setEndDate(value);
      onChange({ endDate: value ? new Date(value).toISOString() : undefined });
    }
  };

  const handleCategoryChange = (category: AuditCategory, selected: boolean) => {
    const currentCategories = query.categories || [];
    
    if (selected) {
      onChange({ categories: [...currentCategories, category] });
    } else {
      onChange({ categories: currentCategories.filter(c => c !== category) });
    }
  };

  const handleSeverityChange = (severity: AuditSeverity, selected: boolean) => {
    const currentSeverities = query.severities || [];
    
    if (selected) {
      onChange({ severities: [...currentSeverities, severity] });
    } else {
      onChange({ severities: currentSeverities.filter(s => s !== severity) });
    }
  };

  const handleQuickTimeFilter = (label: string, startDate: string, endDate?: string) => {
    setStartDate(new Date(startDate).toISOString().split('T')[0]);
    setEndDate(endDate ? new Date(endDate).toISOString().split('T')[0] : '');
    onChange({ 
      startDate, 
      endDate: endDate || undefined 
    });
  };

  const handleReset = () => {
    setSearchText('');
    setStartDate('');
    setEndDate('');
    onReset();
  };

  const quickTimeFilters = auditApi.getQuickTimeFilters();

  return (
    <div className={styles.container}>
      {/* Quick Time Filters */}
      <div>
        <Text size={300} weight="semibold" style={{ marginBottom: tokens.spacingVerticalXS }}>
          Быстрые фильтры по времени:
        </Text>
        <div className={styles.quickFilters}>
          {quickTimeFilters.map((filter) => (
            <Button
              key={filter.label}
              appearance="outline"
              size="small"
              onClick={() => handleQuickTimeFilter(filter.label, filter.startDate, filter.endDate)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Filters Row */}
      <div className={styles.filtersRow}>
        <Field label="Дата начала">
          <Input
            type="date"
            value={startDate}
            onChange={(_, data) => handleDateChange('startDate', data.value)}
          />
        </Field>

        <Field label="Дата окончания">
          <Input
            type="date"
            value={endDate}
            onChange={(_, data) => handleDateChange('endDate', data.value)}
          />
        </Field>

        <Field label="Сортировка">
          <Dropdown
            value={query.sortBy === 'timestamp' ? 'По времени' : 
                  query.sortBy === 'severity' ? 'По серьезности' : 
                  query.sortBy === 'user' ? 'По пользователю' : 'По времени'}
            onOptionSelect={(_, data) => {
              const sortBy = data.optionValue === 'По времени' ? 'timestamp' :
                           data.optionValue === 'По серьезности' ? 'severity' :
                           data.optionValue === 'По пользователю' ? 'user' : 'timestamp';
              onChange({ sortBy: sortBy as any });
            }}
          >
            <Option value="По времени">По времени</Option>
            <Option value="По серьезности">По серьезности</Option>
            <Option value="По пользователю">По пользователю</Option>
          </Dropdown>
        </Field>

        <Field label="Порядок">
          <Dropdown
            value={query.sortOrder === 'desc' ? 'Убывание' : 'Возрастание'}
            onOptionSelect={(_, data) => {
              const sortOrder = data.optionValue === 'Убывание' ? 'desc' : 'asc';
              onChange({ sortOrder: sortOrder as any });
            }}
          >
            <Option value="Убывание">Убывание</Option>
            <Option value="Возрастание">Возрастание</Option>
          </Dropdown>
        </Field>
      </div>

      {/* Search Row */}
      <div className={styles.searchRow}>
        <Field label="Поиск по тексту" style={{ flex: 1 }}>
          <Input
            value={searchText}
            onChange={(_, data) => setSearchText(data.value)}
            placeholder="Поиск в описании, именах ресурсов..."
            contentBefore={<SearchRegular />}
          />
        </Field>
      </div>

      {/* Categories Filter */}
      <div>
        <Text size={300} weight="semibold" style={{ marginBottom: tokens.spacingVerticalXS }}>
          Категории событий:
        </Text>
        <div className={styles.checkboxRow}>
          {(['authentication', 'document', 'signature', 'user_management', 'system'] as AuditCategory[]).map(category => (
            <Checkbox
              key={category}
              label={auditApi.formatCategory(category)}
              checked={query.categories?.includes(category) || false}
              onChange={(_, data) => handleCategoryChange(category, data.checked === true)}
            />
          ))}
        </div>
      </div>

      {/* Severity Filter */}
      <div>
        <Text size={300} weight="semibold" style={{ marginBottom: tokens.spacingVerticalXS }}>
          Уровень серьезности:
        </Text>
        <div className={styles.checkboxRow}>
          {(['low', 'medium', 'high', 'critical'] as AuditSeverity[]).map(severity => (
            <Checkbox
              key={severity}
              label={auditApi.formatSeverity(severity)}
              checked={query.severities?.includes(severity) || false}
              onChange={(_, data) => handleSeverityChange(severity, data.checked === true)}
            />
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div>
        <Text size={300} weight="semibold" style={{ marginBottom: tokens.spacingVerticalXS }}>
          Статус выполнения:
        </Text>
        <div className={styles.checkboxRow}>
          <Checkbox
            label="Только успешные"
            checked={query.onlySuccessful === true}
            onChange={(_, data) => onChange({ 
              onlySuccessful: data.checked ? true : undefined,
              onlyFailed: data.checked ? undefined : query.onlyFailed
            })}
          />
          <Checkbox
            label="Только ошибки"
            checked={query.onlyFailed === true}
            onChange={(_, data) => onChange({ 
              onlyFailed: data.checked ? true : undefined,
              onlySuccessful: data.checked ? undefined : query.onlySuccessful
            })}
          />
          <Checkbox
            label="Включить чувствительные данные"
            checked={query.includeSensitive === true}
            onChange={(_, data) => onChange({ includeSensitive: data.checked ? true : undefined })}
          />
        </div>
      </div>

      {/* Actions Row */}
      <div className={styles.actionsRow}>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          Результатов на странице: {query.limit || 50}
        </Text>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={handleReset}
          >
            Сбросить фильтры
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuditFilters;
