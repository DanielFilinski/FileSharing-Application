/**
 * End User Create Dialog Component
 * Modal form for creating new end users
 */

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEndUser } from '../../contexts/EndUserContext';
import { EndUserFormData, EndUser, AccessLevels, BusinessType } from '../../shared/types/endUser.types';
import { endUserApi } from '../../shared/api/endUserApi';

interface EndUserCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (endUser: EndUser) => void;
}

export const EndUserCreateDialog: React.FC<EndUserCreateDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { createEndUser, isLoading } = useEndUser();
  
  const [formData, setFormData] = useState<EndUserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    firmName: '',
    firmAddress: '',
    businessType: '',
    accessLevel: 'read'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form input changes
  const handleChange = (field: keyof EndUserFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    if (formData.phone && formData.phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newEndUser = await createEndUser(formData);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        firmName: '',
        firmAddress: '',
        businessType: '',
        accessLevel: 'read'
      });
      
      onSuccess?.(newEndUser);
      onClose();
      
    } catch (error: any) {
      console.error('Failed to create end user:', error);
      setErrors({
        submit: error.message || 'Failed to create end user'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing during submission
    
    // Reset form and errors
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      firmName: '',
      firmAddress: '',
      businessType: '',
      accessLevel: 'read'
    });
    setErrors({});
    onClose();
  };
  
  return (
    <Transition appear show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Create New End User
                  </Dialog.Title>
                  
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="p-1 text-gray-400 hover:text-gray-500 disabled:opacity-50"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        disabled={isSubmitting}
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        disabled={isSubmitting}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Contact Information */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                    )}
                  </div>
                  
                  {/* Business Information */}
                  <div>
                    <label htmlFor="firmName" className="block text-sm font-medium text-gray-700">
                      Company/Firm Name
                    </label>
                    <input
                      type="text"
                      id="firmName"
                      value={formData.firmName}
                      onChange={(e) => handleChange('firmName', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                      Business Type
                    </label>
                    <select
                      id="businessType"
                      value={formData.businessType}
                      onChange={(e) => handleChange('businessType', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={isSubmitting}
                    >
                      <option value="">Select business type</option>
                      <option value={BusinessType.INDIVIDUAL}>Individual</option>
                      <option value={BusinessType.LLC}>LLC</option>
                      <option value={BusinessType.CORPORATION}>Corporation</option>
                      <option value={BusinessType.PARTNERSHIP}>Partnership</option>
                      <option value={BusinessType.NON_PROFIT}>Non-profit</option>
                      <option value={BusinessType.OTHER}>Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="firmAddress" className="block text-sm font-medium text-gray-700">
                      Business Address
                    </label>
                    <textarea
                      id="firmAddress"
                      value={formData.firmAddress}
                      onChange={(e) => handleChange('firmAddress', e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  {/* Access Level */}
                  <div>
                    <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700">
                      Access Level *
                    </label>
                    <select
                      id="accessLevel"
                      value={formData.accessLevel}
                      onChange={(e) => handleChange('accessLevel', e.target.value as EndUser['accessLevel'])}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={isSubmitting}
                    >
                      {Object.values(AccessLevels).map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label} - {level.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="text-sm text-red-700">
                        {errors.submit}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                    >
                      {isSubmitting && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      )}
                      {isSubmitting ? 'Creating...' : 'Create End User'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
