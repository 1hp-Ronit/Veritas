import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
import { apiClient } from '../api/client';

export default function CaseInput() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    case_id: '',
    incident_type: '',
    jurisdiction: '',
    date: '',
    description: '',
    modus_operandi: '',
    tags: '',
  });
  
  const [file, setFile] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (file) {
        data.append('image', file);
      }

      const response = await apiClient.post('/api/cases/submit', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Save globally so navbar clicks or refreshes don't lose the active case
      localStorage.setItem('activeCaseId', response.data.case_id);
      localStorage.setItem('activeSubmission', JSON.stringify(response.data));

      // On success, navigate to results pushing the dynamically obtained API insights into router state
      navigate('/results', { state: { submissionResult: response.data } });
      
    } catch (err) {
      console.error(err);
      // In a real app we'd show an error state
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 flex flex-col pt-6 pb-24 h-full relative">
      
      {/* Top Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-normal text-textPrimary tracking-tight">New Case Submission</h1>
          <div className="text-sm text-textSecondary font-mono mt-1 flex items-center gap-2">
            <span>{formData.case_id || 'CIS-2024'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brandBlue"></span>
            <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-0.5 rounded-full">Automated Draft</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-border w-full mb-8"></div>

      {/* Case Details Form */}
      <div className="mb-6 bg-surface border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-[11px] font-bold tracking-widest uppercase text-textSecondary mb-6">Case Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          <div>
            <label className="veritas-label">Case ID</label>
            <input 
              name="case_id"
              value={formData.case_id}
              onChange={handleInputChange}
              className="veritas-input font-mono" 
              placeholder="e.g. CIS-24-001" 
            />
          </div>
          <div>
            <label className="veritas-label">Incident type</label>
            <select 
              name="incident_type"
              value={formData.incident_type}
              onChange={handleInputChange}
              className="veritas-input text-textSecondary appearance-none"
            >
              <option value="" disabled>Select type...</option>
              <option value="armed_robbery">Armed Robbery</option>
              <option value="homicide">Homicide</option>
              <option value="cyber_fraud">Cyber Fraud</option>
              <option value="burglary">Burglary</option>
              <option value="assault">Assault</option>
              <option value="kidnapping">Kidnapping</option>
              <option value="arson">Arson</option>
              <option value="drug_trafficking">Drug Trafficking</option>
              <option value="identity_theft">Identity Theft</option>
              <option value="money_laundering">Money Laundering</option>
              <option value="sexual_assault">Sexual Assault</option>
              <option value="domestic_violence">Domestic Violence</option>
              <option value="extortion">Extortion</option>
              <option value="vehicle_theft">Vehicle Theft</option>
              <option value="vandalism">Vandalism</option>
              <option value="human_trafficking">Human Trafficking</option>
              <option value="forgery">Forgery</option>
              <option value="embezzlement">Embezzlement</option>
              <option value="stalking">Stalking</option>
              <option value="terrorism">Terrorism</option>
              <option value="organized_crime">Organized Crime</option>
              <option value="missing_person">Missing Person</option>
              <option value="hit_and_run">Hit and Run</option>
              <option value="robbery">Robbery</option>
            </select>
          </div>

          <div>
            <label className="veritas-label">Location / jurisdiction</label>
            <input 
              name="jurisdiction"
              value={formData.jurisdiction}
              onChange={handleInputChange}
              className="veritas-input" 
            />
          </div>
          <div>
            <label className="veritas-label">Date of incident</label>
            <input 
              type="date" 
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="veritas-input text-textSecondary" 
            />
          </div>

          <div className="md:col-span-2">
            <label className="veritas-label">Describe the case — victim profile, MO, known facts...</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="veritas-input resize-none" 
              rows="3" 
            />
          </div>

          <div className="md:col-span-2">
            <label className="veritas-label">Modus operandi</label>
            <textarea 
              name="modus_operandi"
              value={formData.modus_operandi}
              onChange={handleInputChange}
              className="veritas-input resize-none" 
              rows="2" 
            />
          </div>

          <div className="md:col-span-2">
            <label className="veritas-label">Tags</label>
            <input 
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="veritas-input font-mono text-xs" 
              placeholder="armed-robbery, two-person-team..." 
            />
          </div>
        </div>
      </div>

      {/* Evidence Upload */}
      <div className="mb-8 flex-1 bg-surface border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xs tracking-widest uppercase text-textSecondary mb-4">Evidence Upload</h2>
        
        <div className="border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl h-[140px] flex flex-col items-center justify-center p-4 relative">
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
          <UploadCloud className="text-blue-500 w-8 h-8 mb-2" />
          <span className="text-sm font-medium text-textPrimary mb-1">Drag sketch or crime scene photo here</span>
          <span className="text-xs text-textSecondary mb-4">JPG, PNG, PDF — max 20MB</span>
          <button className="veritas-btn-secondary relative pointer-events-none">
            Browse files
          </button>
        </div>

        {/* Thumbnails row */}
        <div className="flex gap-4 mt-6 overflow-x-auto pb-2">
          {file && (
             <div className="flex flex-col gap-2 w-24 flex-shrink-0">
               <div className="h-20 bg-gray-100 border border-border rounded-lg flex items-center justify-center overflow-hidden">
                 {/* Preview mock */}
                 <div className="text-xs font-semibold text-blue-500">Preview</div>
               </div>
               <span className="text-xs font-medium text-textPrimary truncate max-w-full text-center tracking-tight" title={file.name}>{file.name}</span>
             </div>
          )}
          
          <div className="flex flex-col gap-2 w-24 flex-shrink-0">
             <label className="h-20 bg-transparent border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative">
               <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
               <span className="text-blue-600 font-medium text-sm">+ Add</span>
             </label>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-between px-8 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div></div>
        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-gray-100 px-4 py-2 rounded-full transition-colors focus:outline-none">
            Save draft
          </button>
          <button onClick={handleSubmit} disabled={loading} className="veritas-btn-primary flex items-center gap-2">
            Run retrieval &rarr;
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-10 h-10 relative mb-6">
             <div className="absolute inset-0 rounded-full border-4 border-gray-200 border-t-accent animate-spin"></div>
          </div>
          <p className="text-sm text-textPrimary font-medium">Retrieving similar cases and generating investigative leads...</p>
        </div>
      )}
    </div>
  );
}
