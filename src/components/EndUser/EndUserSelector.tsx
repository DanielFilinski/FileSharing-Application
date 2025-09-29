/**
 * End User Selector Component
 * Main selector for choosing the current end user context
 */

import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, UserIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useEndUser } from '../../contexts/EndUserContext';
import { EndUserSelectorProps, EndUser } from '../../shared/types/endUser.types';
import { EndUserCreateDialog } from './EndUserCreateDialog';

export const EndUserSelector: React.FC<EndUserSelectorProps> = ({
  accessFilter,
  placeholder = 'Select End User',
  onChange,
  disabled = false,
  size = 'md',
  className = '',
  searchable = true,
  allowCreate = true
}) => {
  const {
    selectedEndUser,
    endUsers,
    isLoading,
    error,
    selectEndUser,
    clearSelection
  } = useEndUser();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Filter and search end users
  const filteredEndUsers = useMemo(() => {
    let filtered = endUsers.filter(endUser => endUser.isActive);
    
    // Apply access filter
    if (accessFilter && accessFilter.length > 0) {
      filtered = filtered.filter(endUser => 
        accessFilter.includes(endUser.accessLevel)
      );
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(endUser => 
        endUser.displayName.toLowerCase().includes(query) ||
        endUser.email.toLowerCase().includes(query) ||
        endUser.firmName?.toLowerCase().includes(query) ||
        endUser.firstName.toLowerCase().includes(query) ||
        endUser.lastName.toLowerCase().includes(query)
      );
    }
    
    return filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [endUsers, accessFilter, searchQuery]);
  
  // Size classes
  const sizeClasses = {
    sm: 'py-1 px-2 text-sm',
    md: 'py-2 px-3 text-base',
    lg: 'py-3 px-4 text-lg'
  };
  
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  };
  
  // Handle selection
  const handleSelect = (endUser: EndUser) => {
    selectEndUser(endUser);
    onChange?.(endUser);
    setIsOpen(false);
    setSearchQuery('');
  };
  
  const handleClear = () => {
    clearSelection();
    onChange?.(null);
    setIsOpen(false);
    setSearchQuery('');
  };
  
  const handleCreateSuccess = (newEndUser: EndUser) => {
    setShowCreateDialog(false);
    handleSelect(newEndUser);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`relative inline-block ${className}`}>
        <div className={`
          flex items-center justify-between
          border border-gray-300 rounded-lg bg-white
          ${sizeClasses[size]}
          opacity-50 cursor-not-allowed
        `}>
          <span className="text-gray-500">Loading end users...</span>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`relative inline-block ${className}`}>
        <div className={`
          flex items-center justify-between
          border border-red-300 rounded-lg bg-red-50
          ${sizeClasses[size]}
        `}>
          <span className="text-red-600 text-sm">Error: {error}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full min-w-[200px]
          border border-gray-300 rounded-lg bg-white shadow-sm
          hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200
          ${sizeClasses[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
        `}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <UserIcon className={`${iconSizes[size]} text-gray-400 flex-shrink-0`} />
          
          {selectedEndUser ? (
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {selectedEndUser.displayName}
              </div>
              {selectedEndUser.firmName && (
                <div className="text-xs text-gray-500 truncate">
                  {selectedEndUser.firmName}
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-500 truncate">{placeholder}</span>
          )}
        </div>
        
        <ChevronDownIcon 
          className={`
            ${iconSizes[size]} text-gray-400 flex-shrink-0 ml-2
            transition-transform duration-200
            ${isOpen ? 'transform rotate-180' : ''}
          `}
        />
      </button>
      
      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search end users..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          
          {/* End Users List */}
          <div className="max-h-60 overflow-y-auto">
            {/* Clear Selection Option */}
            {selectedEndUser && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center space-x-2 border-b border-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-600">×</span>
                </div>
                <span className="text-gray-600 italic">Clear selection</span>
              </button>
            )}
            
            {/* End Users */}
            {filteredEndUsers.length > 0 ? (
              filteredEndUsers.map((endUser) => (
                <button
                  key={endUser.id}
                  type="button"
                  onClick={() => handleSelect(endUser)}
                  className={`
                    w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center space-x-3
                    ${selectedEndUser?.id === endUser.id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                  `}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600">
                      {endUser.firstName[0]}{endUser.lastName[0]}
                    </span>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {endUser.displayName}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {endUser.email}
                      {endUser.firmName && ` • ${endUser.firmName}`}
                    </div>
                  </div>
                  
                  {/* Access Level Badge */}
                  <div className={`
                    px-2 py-1 rounded-full text-xs font-medium flex-shrink-0
                    ${endUser.accessLevel === 'admin' ? 'bg-red-100 text-red-800' : 
                      endUser.accessLevel === 'write' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'}
                  `}>
                    {endUser.accessLevel}
                  </div>
                  
                  {/* Selected Indicator */}
                  {selectedEndUser?.id === endUser.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-gray-500">
                {searchQuery ? 'No end users match your search' : 'No end users available'}
              </div>
            )}
          </div>
          
          {/* Create New Button */}
          {allowCreate && (
            <div className="border-t border-gray-200 p-2">
              <button
                type="button"
                onClick={() => setShowCreateDialog(true)}
                className="w-full flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create New End User</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Create Dialog */}
      <EndUserCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};
