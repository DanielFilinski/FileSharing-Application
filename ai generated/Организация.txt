import React, { useState } from 'react';
import { Plus, X, Settings, Building2, MapPin, Save, Check } from 'lucide-react';

const OrganizationSettingsForm = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [offices, setOffices] = useState([]);
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficeAddress, setNewOfficeAddress] = useState('');
  const [showAddOffice, setShowAddOffice] = useState(false);
  const [activeTabId, setActiveTabId] = useState('general');

  const handleAddOffice = () => {
    if (newOfficeName.trim() && newOfficeAddress.trim()) {
      setOffices([...offices, { name: newOfficeName, address: newOfficeAddress }]);
      setNewOfficeName('');
      setNewOfficeAddress('');
      setShowAddOffice(false);
    }
  };

  const handleRemoveOffice = (index) => {
    const updatedOffices = [...offices];
    updatedOffices.splice(index, 1);
    setOffices(updatedOffices);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50" style={{ fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '-0.01em' }}>
      {/* Header */}
      <div className="py-4 px-6 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center">
          <Settings className="text-purple-600 mr-3" size={20} />
          <h1 className="text-xl font-semibold text-gray-900">Organization Settings</h1>
        </div>
        <button className="text-white bg-purple-600 hover:bg-purple-700 py-1.5 px-4 rounded-md text-sm font-medium flex items-center transition-colors duration-200">
          <Save size={16} className="mr-1.5" />
          Save changes
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-6">
          <button 
            onClick={() => setActiveTabId('general')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTabId === 'general' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTabId('offices')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTabId === 'offices' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Offices
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {activeTabId === 'general' && (
            <>
              {/* Company Information Section */}
              <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-700 p-1 rounded-md mr-2">
                    <Building2 size={18} />
                  </span>
                  Company Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Contact</label>
                    <input
                      type="text"
                      value={companyContact}
                      onChange={(e) => setCompanyContact(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
                      placeholder="Enter company contact number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Email</label>
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
                      placeholder="Enter company email"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information Section */}
              <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-700 p-1 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </span>
                  Owner Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner Full Name</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
                      placeholder="Enter owner's full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner Contact</label>
                    <input
                      type="text"
                      value={ownerContact}
                      onChange={(e) => setOwnerContact(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
                      placeholder="Enter owner's contact number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner Email</label>
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
                      placeholder="Enter owner's email"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          
          {activeTabId === 'offices' && (
            /* Offices Section */
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="bg-purple-100 text-purple-700 p-1 rounded-md mr-2">
                    <Building2 size={18} />
                  </span>
                  Offices
                </h2>
                <button 
                  onClick={() => setShowAddOffice(true)}
                  className="text-purple-600 hover:bg-purple-50 py-1.5 px-3 rounded-md text-sm font-medium flex items-center transition-colors duration-200"
                >
                  <Plus size={16} className="mr-1.5" />
                  Add Office
                </button>
              </div>
              
              {/* Office List */}
              <div className="space-y-3">
                {offices.length > 0 ? (
                  offices.map((office, index) => (
                    <div key={index} className="border border-gray-200 hover:border-purple-200 rounded-lg p-4 bg-white relative shadow-sm hover:shadow transition-all duration-200">
                      <button 
                        onClick={() => handleRemoveOffice(index)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X size={16} />
                      </button>
                      <div className="flex items-start">
                        <div className="mr-3 mt-1 flex-shrink-0 bg-purple-100 text-purple-600 rounded-md p-1.5">
                          <Building2 size={16} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{office.name}</h3>
                          <div className="flex items-start mt-2 text-gray-600">
                            <MapPin size={14} className="mr-1.5 mt-0.5 flex-shrink-0 text-purple-500" />
                            <p className="text-sm">{office.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="inline-block p-3 bg-gray-100 rounded-full mb-3">
                      <Building2 size={24} className="text-gray-400" />
                    </div>
                    <p className="font-medium">No offices added yet</p>
                    <p className="text-sm mt-1">Click "Add Office" to add your first office location</p>
                  </div>
                )}
              </div>
              
              {/* Add Office Form */}
              {showAddOffice && (
                <div className="mt-5 border border-purple-200 rounded-lg p-5 bg-purple-50 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-purple-900 flex items-center">
                      <Plus size={16} className="mr-1.5 text-purple-600" />
                      Add New Office
                    </h3>
                    <button onClick={() => setShowAddOffice(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Office Name</label>
                      <input
                        type="text"
                        value={newOfficeName}
                        onChange={(e) => setNewOfficeName(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white transition-colors"
                        placeholder="Enter office name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Office Address</label>
                      <textarea
                        value={newOfficeAddress}
                        onChange={(e) => setNewOfficeAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white transition-colors"
                        placeholder="Enter office address"
                        rows="2"
                      ></textarea>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={() => setShowAddOffice(false)}
                        className="mr-3 text-gray-600 hover:text-gray-900 py-2 px-4 rounded-md text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddOffice}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium flex items-center transition-colors"
                        disabled={!newOfficeName.trim() || !newOfficeAddress.trim()}
                      >
                        <Check size={16} className="mr-1.5" />
                        Add Office
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettingsForm;