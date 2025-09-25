/**
 * Pagination Component
 * 
 * Provides pagination controls for large data sets with customizable
 * page size and navigation options.
 * 
 * @features
 * - Configurable page sizes
 * - First/Previous/Next/Last navigation
 * - Page input for direct navigation
 * - Responsive design
 * - Accessibility support
 */
import React from 'react';
import {
  Button,
  Input,
  Dropdown,
  Option,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  ChevronLeft20Regular,
  ChevronRight20Regular,
  ChevronDoubleLeft20Regular,
  ChevronDoubleRight20Regular
} from '@fluentui/react-icons';

// Pagination configuration interface
export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  className?: string;
}

// Default page size options
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Styles for the pagination component
const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalM} 0`,
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: tokens.spacingVerticalS,
      alignItems: 'stretch'
    }
  },
  pageInfo: {
    color: tokens.colorNeutralForeground2,
    '@media (max-width: 768px)': {
      textAlign: 'center'
    }
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    '@media (max-width: 768px)': {
      justifyContent: 'center',
      flexWrap: 'wrap'
    }
  },
  pageInput: {
    width: '60px'
  },
  pageSizeSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  pageSizeDropdown: {
    minWidth: '70px'
  }
});

/**
 * Calculates pagination values
 * @param currentPage - Current page number (1-based)
 * @param totalItems - Total number of items
 * @param pageSize - Items per page
 * @returns Pagination calculations
 */
export const usePagination = (currentPage: number, totalItems: number, pageSize: number) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  
  return {
    totalPages,
    startItem,
    endItem,
    hasNextPage,
    hasPreviousPage
  };
};

/**
 * Pagination component with navigation and page size controls
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showPageSizeSelector = true,
  showPageInfo = true,
  className
}) => {
  const styles = useStyles();
  
  const {
    totalPages,
    startItem,
    endItem,
    hasNextPage,
    hasPreviousPage
  } = usePagination(currentPage, totalItems, pageSize);

  /**
   * Handles page input change
   */
  const handlePageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const pageNumber = parseInt(value);
    
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    }
  };

  /**
   * Handles page input key press for Enter key
   */
  const handlePageInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handlePageInputChange(event as any);
    }
  };

  // Don't render pagination if there are no items or only one page
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Page Size Selector */}
      {showPageSizeSelector && (
        <div className={styles.pageSizeSelector}>
          <Text>Show:</Text>
          <Dropdown
            className={styles.pageSizeDropdown}
            value={pageSize.toString()}
            onOptionSelect={(e, data) => {
              const newPageSize = parseInt(data.optionValue || '10');
              onPageSizeChange(newPageSize);
            }}
          >
            {pageSizeOptions.map(option => (
              <Option key={option} value={option.toString()}>
                {option}
              </Option>
            ))}
          </Dropdown>
          <Text>per page</Text>
        </div>
      )}

      {/* Page Info */}
      {showPageInfo && (
        <div className={styles.pageInfo}>
          <Text>
            Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {totalItems.toLocaleString()} items
          </Text>
        </div>
      )}

      {/* Navigation Controls */}
      <div className={styles.controls}>
        {/* First Page */}
        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronDoubleLeft20Regular />}
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(1)}
          aria-label="First page"
        />

        {/* Previous Page */}
        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronLeft20Regular />}
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        />

        {/* Page Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Text>Page</Text>
          <Input
            className={styles.pageInput}
            value={currentPage.toString()}
            onChange={handlePageInputChange}
            onKeyPress={handlePageInputKeyPress}
            aria-label="Current page"
          />
          <Text>of {totalPages}</Text>
        </div>

        {/* Next Page */}
        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronRight20Regular />}
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        />

        {/* Last Page */}
        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronDoubleRight20Regular />}
          disabled={!hasNextPage}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
        />
      </div>
    </div>
  );
};

/**
 * Hook for managing pagination state
 * @param initialPageSize - Initial page size
 * @returns Pagination state and handlers
 */
export const usePaginationState = (initialPageSize: number = 25) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  /**
   * Handles page change and resets to page 1 if current page exceeds total pages
   */
  const handlePageChange = (page: number, totalItems: number) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const validPage = Math.min(Math.max(1, page), totalPages || 1);
    setCurrentPage(validPage);
  };

  /**
   * Handles page size change and adjusts current page accordingly
   */
  const handlePageSizeChange = (newPageSize: number, totalItems: number) => {
    const newTotalPages = Math.ceil(totalItems / newPageSize);
    const currentItemIndex = (currentPage - 1) * pageSize;
    const newPage = Math.floor(currentItemIndex / newPageSize) + 1;
    
    setPageSize(newPageSize);
    setCurrentPage(Math.min(newPage, newTotalPages || 1));
  };

  /**
   * Resets pagination to first page
   */
  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    pageSize,
    setCurrentPage: (page: number, totalItems: number) => handlePageChange(page, totalItems),
    setPageSize: (size: number, totalItems: number) => handlePageSizeChange(size, totalItems),
    resetPage
  };
};
