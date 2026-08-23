import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Building2, 
  Users, 
  Briefcase, 
  FileText, 
  Layers, 
  Settings2, 
  StickyNote, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  Eye,
  ArrowRight
} from 'lucide-react';
import { 
  ProjectRecord, 
  ProjectTypeOption, 
  ContractTypeOption, 
  ScopeOption, 
  ConsultantEntry 
} from '../types';
import { createEmptyProjectData } from '../data/initialData';

interface ProjectSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProject?: ProjectRecord | null;
  onSave: (savedProject: ProjectRecord, openImmediately: boolean) => Promise<void> | void;
}

const PROJECT_TYPES: ProjectTypeOption[] = [
  'RCC Building',
  'Steel Structure',
  'Industrial',
  'Commercial',
  'Residential',
  'School',
  'Hospital',
  'Warehouse',
  'Mixed RCC + Steel',
  'Turnkey / Lock & Key',
  'Other',
];

const CONTRACT_TYPES: ContractTypeOption[] = [
  'Lump Sum',
  'BOQ',
  'Unit Rate',
  'Design & Build',
  'Turnkey',
  'Other',
];

const SCOPE_OPTIONS: ScopeOption[] = [
  'Civil',
  'Structural',
  'Architectural',
  'MEP',
  'Steel',
  'Roofing',
  'Cladding',
  'Complete Turnkey',
  'Other',
];

const CURRENCIES = [
  { code: 'AED', symbol: 'AED', label: 'AED - UAE Dirham' },
  { code: 'USD', symbol: '$', label: 'USD - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP - British Pound' },
  { code: 'INR', symbol: '₹', label: 'INR - Indian Rupee' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR - Saudi Riyal' },
  { code: 'QAR', symbol: 'QAR', label: 'QAR - Qatari Riyal' },
  { code: 'OMR', symbol: 'OMR', label: 'OMR - Omani Rial' },
  { code: 'KWD', symbol: 'KWD', label: 'KWD - Kuwaiti Dinar' },
  { code: 'CUSTOM', symbol: '', label: 'Other / Custom Currency' },
];

const ENGINEERING_CODES = [
  'ACI (American Concrete Institute)',
  'BS (British Standards)',
  'Eurocode (EN Standards)',
  'ASTM (American Society for Testing and Materials)',
  'IS (Indian Standards)',
  'IBC (International Building Code)',
  'Project Specific Standard',
];

type SectionTab = 
  | 'company'
  | 'client'
  | 'consultants'
  | 'project'
  | 'tender'
  | 'engineering'
  | 'notes';

export const ProjectSetupModal: React.FC<ProjectSetupModalProps> = ({
  isOpen,
  onClose,
  initialProject,
  onSave,
}) => {
  const [formData, setFormData] = useState<ProjectRecord>(
    initialProject ? { ...initialProject } : createEmptyProjectData()
  );
  const [activeTab, setActiveTab] = useState<SectionTab>('project');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>(initialProject?.company?.logoUrl || '');
  const [customCurrencyCode, setCustomCurrencyCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialProject) {
        setFormData({ ...initialProject });
        setLogoPreview(initialProject.company?.logoUrl || '');
      } else {
        setFormData(createEmptyProjectData());
        setLogoPreview('');
      }
      setErrors({});
      setIsSaving(false);
      setActiveTab('project');
    }
  }, [isOpen, initialProject]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialProject?.id && initialProject.id.trim() !== '');

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 1. Company Name *
    if (!formData.company?.name || formData.company.name.trim() === '') {
      newErrors['company.name'] = 'Company / Contractor Name is required.';
    }

    // 2. Client Name *
    if (!formData.client?.name || formData.client.name.trim() === '') {
      newErrors['client.name'] = 'Client / Employer Name is required.';
    }

    // 3. Project Name *
    if (!formData.project?.name || formData.project.name.trim() === '') {
      newErrors['project.name'] = 'Project Name is required.';
    }

    // 4. Project Location *
    if (!formData.project?.location || formData.project.location.trim() === '') {
      newErrors['project.location'] = 'Project Location is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setFormData((prev) => ({
          ...prev,
          company: { ...prev.company, logoUrl: base64 },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Save
  const handleSave = async (openImmediately: boolean) => {
    if (!validateForm()) {
      // Find the first tab with an error and navigate to it
      if (errors['project.name'] || errors['project.location']) {
        setActiveTab('project');
      } else if (errors['company.name']) {
        setActiveTab('company');
      } else if (errors['client.name']) {
        setActiveTab('client');
      }
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData, openImmediately);
      onClose();
    } catch (err) {
      console.error('Error during save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Consultant dynamic helpers
  const handleAddConsultant = () => {
    const newEntry: ConsultantEntry = {
      id: `CONS-${Date.now().toString().slice(-4)}`,
      name: '',
      role: 'Architect',
      city: '',
      country: '',
      contactPerson: '',
      phone: '',
      email: '',
    };
    setFormData((prev) => ({
      ...prev,
      consultants: [...(prev.consultants || []), newEntry],
    }));
  };

  const handleUpdateConsultant = (index: number, field: keyof ConsultantEntry, value: string) => {
    setFormData((prev) => {
      const updated = [...(prev.consultants || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, consultants: updated };
    });
  };

  const handleRemoveConsultant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      consultants: prev.consultants?.filter((_, i) => i !== index) || [],
    }));
  };

  // Scope toggle helper
  const handleToggleScope = (scopeItem: ScopeOption) => {
    setFormData((prev) => {
      const current = prev.tender?.scope || [];
      const updated = current.includes(scopeItem)
        ? current.filter((s) => s !== scopeItem)
        : [...current, scopeItem];
      return {
        ...prev,
        tender: { ...prev.tender, scope: updated },
      };
    });
  };

  // Code toggle helper
  const handleToggleCode = (codeText: string) => {
    setFormData((prev) => {
      const current = prev.engineeringSettings?.applicableCodes || [];
      const updated = current.includes(codeText)
        ? current.filter((c) => c !== codeText)
        : [...current, codeText];
      return {
        ...prev,
        engineeringSettings: { ...prev.engineeringSettings, applicableCodes: updated },
      };
    });
  };

  // Currency select helper
  const handleCurrencySelect = (code: string) => {
    if (code === 'CUSTOM') {
      setFormData((prev) => ({
        ...prev,
        tender: { ...prev.tender, currency: customCurrencyCode || 'CUSTOM', currencySymbol: customCurrencyCode || '' },
      }));
    } else {
      const curr = CURRENCIES.find((c) => c.code === code);
      setFormData((prev) => ({
        ...prev,
        tender: { ...prev.tender, currency: code, currencySymbol: curr?.symbol || code },
      }));
    }
  };

  const tabs: { id: SectionTab; label: string; icon: any; errorCount: number }[] = [
    {
      id: 'project',
      label: '4. Project Information',
      icon: Building2,
      errorCount: (errors['project.name'] ? 1 : 0) + (errors['project.location'] ? 1 : 0),
    },
    {
      id: 'company',
      label: '1. Contractor / Company',
      icon: Briefcase,
      errorCount: errors['company.name'] ? 1 : 0,
    },
    {
      id: 'client',
      label: '2. Client / Employer',
      icon: Users,
      errorCount: errors['client.name'] ? 1 : 0,
    },
    {
      id: 'consultants',
      label: '3. Consultant(s)',
      icon: Layers,
      errorCount: 0,
    },
    {
      id: 'tender',
      label: '5. Tender & Commercial',
      icon: FileText,
      errorCount: 0,
    },
    {
      id: 'engineering',
      label: '6. Engineering & Units',
      icon: Settings2,
      errorCount: 0,
    },
    {
      id: 'notes',
      label: '7. Notes & Specs',
      icon: StickyNote,
      errorCount: 0,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900">
                  {isEditing ? `Edit Project: ${formData.project.name || 'Unnamed'}` : 'Create New Project Record'}
                </h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md font-semibold bg-slate-200 text-slate-700">
                  {formData.id || 'ID will be generated upon save'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter project parameters, organizational structure, tender specifications, and measurement settings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Close without saving"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Errors Alert Banner */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Please correct the missing required fields before saving:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-700">
                {Object.values(errors).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-slate-100/50 flex gap-1.5 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.errorCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {tab.errorCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">

          {/* ============================================================ */}
          {/* 1. CONTRACTOR / COMPANY INFORMATION */}
          {/* ============================================================ */}
          {activeTab === 'company' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Contractor / Bidding Company Information
                </h3>
                <p className="text-xs text-slate-500">
                  Enter details of the main contractor submitting the tender proposal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Company Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Civil & Structural Contracting LLC"
                    value={formData.company?.name || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        company: { ...formData.company, name: e.target.value },
                      });
                      if (errors['company.name']) {
                        setErrors((prev) => {
                          const n = { ...prev };
                          delete n['company.name'];
                          return n;
                        });
                      }
                    }}
                    className={`w-full bg-white border rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                      errors['company.name'] ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors['company.name'] && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors['company.name']}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Company Registration / License No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CR-908234-A / Trade License 104820"
                    value={formData.company?.licenseNumber || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: { ...formData.company, licenseNumber: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Website</label>
                  <input
                    type="text"
                    placeholder="e.g. https://www.contractor.com"
                    value={formData.company?.website || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: { ...formData.company, website: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Company Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Suite 402, Financial Commercial Tower"
                    value={formData.company?.address || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: { ...formData.company, address: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Dubai"
                    value={formData.company?.city || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: { ...formData.company, city: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. United Arab Emirates"
                    value={formData.company?.country || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: { ...formData.company, country: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Contact Person / Lead Estimator</label>
                  <input
                    type="text"
                    placeholder="e.g. Tariq Al-Mansoor (Chief Estimator)"
                    value={formData.company?.contactPerson || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: { ...formData.company, contactPerson: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +971 4 398 5200"
                    value={formData.company?.phone || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: { ...formData.company, phone: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. tendering@contractor.com"
                    value={formData.company?.email || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: { ...formData.company, email: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Company Logo */}
                <div className="space-y-1.5 md:col-span-2 border-t border-slate-100 pt-3">
                  <label className="text-xs font-semibold text-slate-700">Company Logo</label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="w-16 h-16 border border-slate-200 rounded-lg p-1 bg-slate-50 flex items-center justify-center relative group">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoPreview('');
                            setFormData((prev) => ({
                              ...prev,
                              company: { ...prev.company, logoUrl: '' },
                            }));
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow-2xs hover:bg-rose-700"
                          title="Remove logo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-xs">
                        No Logo
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors border border-slate-200">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-slate-400">
                        PNG, JPG, or SVG for official BOQ exports and report title blocks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. CLIENT / EMPLOYER INFORMATION */}
          {/* ============================================================ */}
          {activeTab === 'client' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Client / Employer Information
                </h3>
                <p className="text-xs text-slate-500">
                  Enter details of the developer, property owner, or issuing employer.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Client Name / Representative <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Faisal Al-Sabah"
                    value={formData.client?.name || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        client: { ...formData.client, name: e.target.value },
                      });
                      if (errors['client.name']) {
                        setErrors((prev) => {
                          const n = { ...prev };
                          delete n['client.name'];
                          return n;
                        });
                      }
                    }}
                    className={`w-full bg-white border rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                      errors['client.name'] ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors['client.name'] && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors['client.name']}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Company / Organization Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marina Waterfront Development Holdings Ltd."
                    value={formData.client?.companyName || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        client: { ...formData.client, companyName: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Marina Boulevard, Tower B, Level 18"
                    value={formData.client?.address || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        client: { ...formData.client, address: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Dubai"
                    value={formData.client?.city || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        client: { ...formData.client, city: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. United Arab Emirates"
                    value={formData.client?.country || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        client: { ...formData.client, country: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Contact Person / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Eng. Sarah Jenkins (Project Director)"
                    value={formData.client?.contactPerson || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        client: { ...formData.client, contactPerson: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +971 4 882 1100"
                    value={formData.client?.phone || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        client: { ...formData.client, phone: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. contracts@marinaholdings.ae"
                    value={formData.client?.email || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        client: { ...formData.client, email: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. CONSULTANT INFORMATION */}
          {/* ============================================================ */}
          {activeTab === 'consultants' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Consultant & Engineering Disciplines
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter key design consultants, structural engineers, architects, and MEP specialists.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddConsultant}
                  className="px-3 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Another Consultant</span>
                </button>
              </div>

              {/* Primary / Lead Consultant Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Primary Discipline Consultants
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Lead Consultant / Firm</label>
                    <input
                      type="text"
                      placeholder="e.g. Atelier Foster & Partners Global"
                      value={formData.consultant?.leadConsultant || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultant: { ...formData.consultant, leadConsultant: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Architect</label>
                    <input
                      type="text"
                      placeholder="e.g. KPF Architectural Design Practice"
                      value={formData.consultant?.architect || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultant: { ...formData.consultant, architect: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Structural Consultant</label>
                    <input
                      type="text"
                      placeholder="e.g. Arup Structural Engineering Consultants"
                      value={formData.consultant?.structuralConsultant || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultant: { ...formData.consultant, structuralConsultant: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">MEP Consultant</label>
                    <input
                      type="text"
                      placeholder="e.g. Buro Happold Engineering Consultancy"
                      value={formData.consultant?.mepConsultant || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultant: { ...formData.consultant, mepConsultant: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Other Consultant (QS / PMC)</label>
                    <input
                      type="text"
                      placeholder="e.g. Currie & Brown International Cost Consultants"
                      value={formData.consultant?.otherConsultant || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultant: { ...formData.consultant, otherConsultant: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Contact Email</label>
                    <input
                      type="email"
                      placeholder="e.g. pm-team@arup-kpf-jv.com"
                      value={formData.consultant?.email || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultant: { ...formData.consultant, email: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Multiple Consultants List */}
              {formData.consultants && formData.consultants.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Additional Project Consultants ({formData.consultants.length})
                  </span>
                  
                  {formData.consultants.map((c, idx) => (
                    <div
                      key={c.id || idx}
                      className="border border-slate-200 rounded-lg p-4 bg-white shadow-2xs space-y-3 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveConsultant(idx)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove consultant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Consultant Name</label>
                          <input
                            type="text"
                            placeholder="e.g. GeoTech Soil Labs"
                            value={c.name}
                            onChange={(e) => handleUpdateConsultant(idx, 'name', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Role / Discipline</label>
                          <select
                            value={c.role}
                            onChange={(e) => handleUpdateConsultant(idx, 'role', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                          >
                            <option value="Lead Consultant">Lead Consultant</option>
                            <option value="Architect">Architect</option>
                            <option value="Structural Consultant">Structural Consultant</option>
                            <option value="MEP Consultant">MEP Consultant</option>
                            <option value="Quantity Surveyor">Quantity Surveyor</option>
                            <option value="Geotechnical">Geotechnical / Soil</option>
                            <option value="Façade Consultant">Façade Consultant</option>
                            <option value="Landscape">Landscape Architect</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Contact Person</label>
                          <input
                            type="text"
                            placeholder="e.g. Dr. K. Raman"
                            value={c.contactPerson || ''}
                            onChange={(e) => handleUpdateConsultant(idx, 'contactPerson', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Email</label>
                          <input
                            type="email"
                            placeholder="e.g. info@geotech.com"
                            value={c.email || ''}
                            onChange={(e) => handleUpdateConsultant(idx, 'email', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Phone</label>
                          <input
                            type="text"
                            placeholder="e.g. +971 4 555 1234"
                            value={c.phone || ''}
                            onChange={(e) => handleUpdateConsultant(idx, 'phone', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">City / Country</label>
                          <input
                            type="text"
                            placeholder="e.g. Dubai, UAE"
                            value={c.city || ''}
                            onChange={(e) => handleUpdateConsultant(idx, 'city', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 4. PROJECT INFORMATION */}
          {/* ============================================================ */}
          {activeTab === 'project' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Project Overview & Geometry Parameters
                </h3>
                <p className="text-xs text-slate-500">
                  Specify physical location, structural typology, and floor level configuration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Project Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marina Bay Commercial Center (G+8 Tower & PEB Steel Hall)"
                    value={formData.project?.name || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        project: { ...formData.project, name: e.target.value },
                      });
                      if (errors['project.name']) {
                        setErrors((prev) => {
                          const n = { ...prev };
                          delete n['project.name'];
                          return n;
                        });
                      }
                    }}
                    className={`w-full bg-white border rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                      errors['project.name'] ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors['project.name'] && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors['project.name']}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Project Number / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. TND-2026-904"
                    value={formData.project?.projectNumber || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: { ...formData.project, projectNumber: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Project Location <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 4, Plot 108, Waterfront Promenade"
                    value={formData.project?.location || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        project: { ...formData.project, location: e.target.value },
                      });
                      if (errors['project.location']) {
                        setErrors((prev) => {
                          const n = { ...prev };
                          delete n['project.location'];
                          return n;
                        });
                      }
                    }}
                    className={`w-full bg-white border rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                      errors['project.location'] ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors['project.location'] && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors['project.location']}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Dubai"
                    value={formData.project?.city || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: { ...formData.project, city: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. United Arab Emirates"
                    value={formData.project?.country || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: { ...formData.project, country: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Project Type</label>
                  <select
                    value={formData.project?.projectType || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: { ...formData.project, projectType: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Project Type --</option>
                    {PROJECT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Building Sub-Type / Function</label>
                  <input
                    type="text"
                    placeholder="e.g. Mixed Commercial Office & Steel Event Hall"
                    value={formData.project?.buildingType || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: { ...formData.project, buildingType: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Floor Level Configuration */}
                <div className="md:col-span-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-bold text-slate-700 block mb-3">
                    Floor Count & Vertical Levels
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Total Floors</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 9"
                        value={formData.project?.numberOfFloors || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            project: {
                              ...formData.project,
                              numberOfFloors: e.target.value ? parseInt(e.target.value, 10) : undefined,
                            },
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Basement Floors</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 2"
                        value={formData.project?.basementFloors || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            project: {
                              ...formData.project,
                              basementFloors: e.target.value ? parseInt(e.target.value, 10) : undefined,
                            },
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Upper Floors</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 8"
                        value={formData.project?.upperFloors || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            project: {
                              ...formData.project,
                              upperFloors: e.target.value ? parseInt(e.target.value, 10) : undefined,
                            },
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Ground Floor Included</label>
                      <div className="flex items-center h-8">
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(formData.project?.groundFloor)}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                project: {
                                  ...formData.project,
                                  groundFloor: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-indigo-600"
                          />
                          <span>Ground Floor (Plinth)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Roof Level Description</label>
                  <input
                    type="text"
                    placeholder="e.g. PEB Truss Roof + Plant Deck"
                    value={formData.project?.roofLevel || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: { ...formData.project, roofLevel: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Approximate Built-up Area (BUA in {formData.engineeringSettings?.areaUnit || 'm²'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 18450"
                    value={formData.project?.builtUpAreaM2 || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: {
                          ...formData.project,
                          builtUpAreaM2: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Site Area ({formData.engineeringSettings?.areaUnit || 'm²'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 6500"
                    value={formData.project?.siteAreaM2 || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: {
                          ...formData.project,
                          siteAreaM2: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Project Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter project scope summary, building characteristics, structural framing notes, etc."
                    value={formData.project?.description || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: { ...formData.project, description: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 5. TENDER INFORMATION */}
          {/* ============================================================ */}
          {activeTab === 'tender' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Tender & Contractual Framework
                </h3>
                <p className="text-xs text-slate-500">
                  Define tender reference numbers, key milestones, contract procurement type, and currency.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tender Name / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Marina Bay Commercial Center Package 04"
                    value={formData.tender?.tenderName || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tender: { ...formData.tender, tenderName: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tender Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TND-2026-904"
                    value={formData.tender?.tenderNumber || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tender: { ...formData.tender, tenderNumber: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tender Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. TND/MB/2026/PKG-04/CIVIL-STR"
                    value={formData.tender?.tenderReference || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tender: { ...formData.tender, tenderReference: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tender Validity</label>
                  <input
                    type="text"
                    placeholder="e.g. 90 Days"
                    value={formData.tender?.tenderValidity || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tender: { ...formData.tender, tenderValidity: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tender Issue Date</label>
                  <input
                    type="date"
                    value={formData.tender?.tenderIssueDate || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tender: { ...formData.tender, tenderIssueDate: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tender Submission Deadline</label>
                  <input
                    type="date"
                    value={formData.tender?.tenderSubmissionDeadline || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tender: { ...formData.tender, tenderSubmissionDeadline: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Contract Type</label>
                  <select
                    value={formData.tender?.contractType || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tender: {
                          ...formData.tender,
                          contractType: (e.target.value as ContractTypeOption) || undefined,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Contract Type --</option>
                    {CONTRACT_TYPES.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Currency Selection - Never assumed! */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Project Currency
                  </label>
                  <select
                    value={formData.tender?.currency || ''}
                    onChange={(e) => handleCurrencySelect(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Currency (Required for BOQ) --</option>
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.tender?.currency === 'CUSTOM' && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Specify Custom Currency</label>
                    <input
                      type="text"
                      placeholder="e.g. CAD, SGD, AUD, BHD"
                      value={customCurrencyCode}
                      onChange={(e) => {
                        setCustomCurrencyCode(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          tender: { ...prev.tender, currency: e.target.value, currencySymbol: e.target.value },
                        }));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 font-mono"
                    />
                  </div>
                )}

                {/* Scope Multiselect */}
                <div className="md:col-span-2 space-y-2 border-t border-slate-100 pt-3">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Scope of Works (Select all applicable)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SCOPE_OPTIONS.map((item) => {
                      const isSelected = formData.tender?.scope?.includes(item);
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => handleToggleScope(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 6. ENGINEERING & MEASUREMENT SETTINGS */}
          {/* ============================================================ */}
          {activeTab === 'engineering' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-indigo-600" />
                  Engineering & Measurement Settings
                </h3>
                <p className="text-xs text-slate-500">
                  Select unit systems and applicable design standards. No default code is assumed automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Unit System */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block">Unit System</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="unitSystem"
                        value="Metric"
                        checked={formData.engineeringSettings?.unitSystem === 'Metric'}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            engineeringSettings: {
                              ...formData.engineeringSettings,
                              unitSystem: 'Metric',
                              lengthUnit: 'm',
                              areaUnit: 'm²',
                              volumeUnit: 'm³',
                              weightUnit: 'kg',
                            },
                          })
                        }
                        className="text-indigo-600"
                      />
                      <span>Metric System (m, m², m³, kg, ton)</span>
                    </label>

                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="unitSystem"
                        value="Imperial"
                        checked={formData.engineeringSettings?.unitSystem === 'Imperial'}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            engineeringSettings: {
                              ...formData.engineeringSettings,
                              unitSystem: 'Imperial',
                              lengthUnit: 'ft',
                              areaUnit: 'ft²',
                              volumeUnit: 'ft³',
                              weightUnit: 'lb',
                            },
                          })
                        }
                        className="text-indigo-600"
                      />
                      <span>Imperial System (ft, in, ft², ft³, lb)</span>
                    </label>
                  </div>
                </div>

                {/* Length Unit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Length Unit</label>
                  <select
                    value={formData.engineeringSettings?.lengthUnit || 'm'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        engineeringSettings: {
                          ...formData.engineeringSettings,
                          lengthUnit: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="mm">mm (Millimeters)</option>
                    <option value="cm">cm (Centimeters)</option>
                    <option value="m">m (Meters)</option>
                    <option value="ft">ft (Feet)</option>
                    <option value="inch">inch (Inches)</option>
                  </select>
                </div>

                {/* Area Unit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Area Unit</label>
                  <select
                    value={formData.engineeringSettings?.areaUnit || 'm²'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        engineeringSettings: {
                          ...formData.engineeringSettings,
                          areaUnit: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="m²">m² (Square Meters)</option>
                    <option value="ft²">ft² (Square Feet)</option>
                  </select>
                </div>

                {/* Volume Unit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Volume Unit</label>
                  <select
                    value={formData.engineeringSettings?.volumeUnit || 'm³'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        engineeringSettings: {
                          ...formData.engineeringSettings,
                          volumeUnit: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="m³">m³ (Cubic Meters)</option>
                    <option value="ft³">ft³ (Cubic Feet)</option>
                  </select>
                </div>

                {/* Weight Unit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Weight Unit</label>
                  <select
                    value={formData.engineeringSettings?.weightUnit || 'kg'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        engineeringSettings: {
                          ...formData.engineeringSettings,
                          weightUnit: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="ton">ton (Metric Tonnes)</option>
                    <option value="lb">lb (Pounds)</option>
                  </select>
                </div>

                {/* Applicable Codes & Standards */}
                <div className="md:col-span-2 space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Applicable Engineering Codes / Standards
                    </label>
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                      No code is auto-selected — choose applicable
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {ENGINEERING_CODES.map((code) => {
                      const isSelected = formData.engineeringSettings?.applicableCodes?.includes(code);
                      return (
                        <label
                          key={code}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleCode(code)}
                            className="rounded text-indigo-600"
                          />
                          <span>{code}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Additional / Project-Specific Standards String
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BS 8110, ACI 318-19, Eurocode 2, IS 1200 Part 2, CESMM4"
                    value={formData.engineeringSettings?.customCodes || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        engineeringSettings: {
                          ...formData.engineeringSettings,
                          customCodes: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 7. PROJECT NOTES & SPECIAL REQUIREMENTS */}
          {/* ============================================================ */}
          {activeTab === 'notes' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-indigo-600" />
                  Project Notes & Special Tender Requirements
                </h3>
                <p className="text-xs text-slate-500">
                  Record specific measurement rules, client exclusions, wastage allowances, and consultant directives.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 block">
                  Project Notes / Special Requirements
                </label>
                <textarea
                  rows={8}
                  placeholder={`Enter specific estimation guidelines, for example:
- Measurement rules (e.g. POMI standard rules apply)
- Client requirements & milestone schedules
- Consultant instructions or addenda amendments
- Tender exclusions (e.g. sub-base earthworks excluded)
- Material wastage caps (e.g. 3.5% rebar, 2.5% concrete)
- Project-specific BOQ grouping instructions`}
                  value={formData.projectNotes || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      projectNotes: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md p-3 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span className="text-rose-500 font-bold">*</span> Indicates required fields
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-4 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-slate-600" />
              <span>{isSaving ? 'Saving...' : 'SAVE PROJECT'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-4.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'SAVE & OPEN PROJECT'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
