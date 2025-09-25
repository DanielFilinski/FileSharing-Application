import React, { useState } from 'react';
import {
  Input,
  Dropdown,
  Option,
  Button,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { Search20Regular, Filter20Regular, Dismiss20Regular } from '@fluentui/react-icons';

// Filter options interface
export interface FilterOption {
  key: string;
  text: string;
  value: string;
}

// Search and filter props interface
interface SearchAndFilterProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  onClearFilters?: () => void;
  className?: string;
}

// Styles for the search and filter component
const useStyles = makeStyles({
  container: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    padding: `${tokens.spacingVerticalM} 0`,
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: tokens.spacingVerticalS
    }
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '200px'
  },
  filtersContainer: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: tokens.spacingVerticalXS
    }
  },
  filterDropdown: {
    minWidth: '150px'
  }
});

/**
 * Search and filter component for data tables
 * Provides search input and dropdown filters with clear functionality
 * 
 * @param searchPlaceholder - Placeholder text for search input
 * @param searchValue - Current search value
 * @param onSearchChange - Handler for search value changes
 * @param filters - Array of filter configurations
 * @param onClearFilters - Handler for clearing all filters
 * @param className - Additional CSS classes
 */
export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters = [],
  onClearFilters,
  className
}) => {
  const styles = useStyles();
  
  // Check if any filters are active
  const hasActiveFilters = filters.some(filter => filter.value !== '');
  
  /**
   * Handles clearing all filters and search
   */
  const handleClearAll = () => {
    onSearchChange('');
    onClearFilters?.();
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Search Input */}
      <div className={styles.searchContainer}>
        <Input
          contentBefore={<Search20Regular />}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e, data) => onSearchChange(data.value)}
        />
      </div>

      {/* Filter Dropdowns */}
      {filters.length > 0 && (
        <div className={styles.filtersContainer}>
          <Filter20Regular />
          {filters.map((filter, index) => (
            <Dropdown
              key={filter.label}
              className={styles.filterDropdown}
              placeholder={filter.label}
              value={filter.value}
              onOptionSelect={(e, data) => filter.onChange(data.optionValue || '')}
            >
              <Option value="">All {filter.label}</Option>
              {filter.options.map(option => (
                <Option key={option.key} value={option.value}>
                  {option.text}
                </Option>
              ))}
            </Dropdown>
          ))}
        </div>
      )}

      {/* Clear Filters Button */}
      {(searchValue || hasActiveFilters) && (
        <Button
          appearance="subtle"
          icon={<Dismiss20Regular />}
          onClick={handleClearAll}
        >
          Clear
        </Button>
      )}
    </div>
  );
};
