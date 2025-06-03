import React, { useState } from 'react';
import { Plus, X, Settings, Building2, MapPin, Save, Check } from 'lucide-react';
import './Organization.css';



const OrganizationSettings: React.FC = () => {
  
  const [companyName, setCompanyName] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [offices, setOffices] = useState<Array<{ name: string; address: string }>>([]);
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

  const handleRemoveOffice = (index: number) => {
    const updatedOffices = [...offices];
    updatedOffices.splice(index, 1);
    setOffices(updatedOffices);
  };

  return (
    <div>
      <div className="organization-container">
        {/* Header */}
        <div className="header">
          <div className="header-title">
            <Settings className="header-icon" size={20} />
            <h1 className="header-heading">Organization Settings</h1>
          </div>
          <button className="save-button">
            <Save size={16} className="mr-1.5" />
            Save changes
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <div className="tab-list">
            <button 
              onClick={() => setActiveTabId('general')}
              className={`tab-button ${activeTabId === 'general' ? 'active' : ''}`}
            >
              General
            </button>
            <button 
              onClick={() => setActiveTabId('offices')}
              className={`tab-button ${activeTabId === 'offices' ? 'active' : ''}`}
            >
              Offices
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="content">
          <div className="content-container">
            {activeTabId === 'general' && (
              <>
                {/* Company Information Section */}
                <div className="section">
                  <h2 className="section-header">
                    <span className="section-icon">
                      <Building2 size={18} />
                    </span>
                    Company Information
                  </h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="form-input"
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company Contact</label>
                      <input
                        type="text"
                        value={companyContact}
                        onChange={(e) => setCompanyContact(e.target.value)}
                        className="form-input"
                        placeholder="Enter company contact number"
                      />
                    </div>
                    <div className="form-group md:col-span-2">
                      <label className="form-label">Company Email</label>
                      <input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className="form-input"
                        placeholder="Enter company email"
                      />
                    </div>
                  </div>
                </div>

                {/* Owner Information Section */}
                <div className="section">
                  <h2 className="section-header">
                    <span className="section-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </span>
                    Owner Information
                  </h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Owner Full Name</label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="form-input"
                        placeholder="Enter owner's full name"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Owner Contact</label>
                      <input
                        type="text"
                        value={ownerContact}
                        onChange={(e) => setOwnerContact(e.target.value)}
                        className="form-input"
                        placeholder="Enter owner's contact number"
                      />
                    </div>
                    <div className="form-group md:col-span-2">
                      <label className="form-label">Owner Email</label>
                      <input
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="form-input"
                        placeholder="Enter owner's email"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {activeTabId === 'offices' && (
              <div className="section">
                <div className="form-header">
                  <h2 className="section-header">
                    <span className="section-icon">
                      <Building2 size={18} />
                    </span>
                    Offices
                  </h2>
                  <button 
                    onClick={() => setShowAddOffice(true)}
                    className="add-button"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Add Office
                  </button>
                </div>
                
                {/* Office List */}
                <div className="office-list">
                  {offices.length > 0 ? (
                    offices.map((office, index) => (
                      <div key={index} className="office-item">
                        <button 
                          onClick={() => handleRemoveOffice(index)}
                          className="office-remove"
                        >
                          <X size={16} />
                        </button>
                        <div className="office-content">
                          <div className="office-icon">
                            <Building2 size={16} />
                          </div>
                          <div className="office-details">
                            <h3 className="office-name">{office.name}</h3>
                            <div className="office-address">
                              <MapPin size={14} className="office-address-icon" />
                              <p className="office-address-text">{office.address}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <Building2 size={24} />
                      </div>
                      <p className="empty-title">No offices added yet</p>
                      <p className="empty-description">Click "Add Office" to add your first office location</p>
                    </div>
                  )}
                </div>
                
                {/* Add Office Form */}
                {showAddOffice && (
                  <div className="add-office-form">
                    <div className="form-header">
                      <h3 className="form-title">
                        <Plus size={16} className="mr-1.5" />
                        Add New Office
                      </h3>
                      <button onClick={() => setShowAddOffice(false)} className="form-close">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Office Name</label>
                        <input
                          type="text"
                          value={newOfficeName}
                          onChange={(e) => setNewOfficeName(e.target.value)}
                          className="form-input"
                          placeholder="Enter office name"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Office Address</label>
                        <textarea
                          value={newOfficeAddress}
                          onChange={(e) => setNewOfficeAddress(e.target.value)}
                          className="form-input"
                          placeholder="Enter office address"
                          rows={2}
                        ></textarea>
                      </div>
                      <div className="form-actions">
                        <button 
                          onClick={() => setShowAddOffice(false)}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddOffice}
                          className="add-button"
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
    </div>
  );
};

export default OrganizationSettings;