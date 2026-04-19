import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMatchesPopup, setShowMatchesPopup] = useState(false);

  let submissionResult = location.state?.submissionResult;
  if (!submissionResult) {
    const stored = localStorage.getItem('activeSubmission');
    if (stored) {
      try {
        submissionResult = JSON.parse(stored);
      } catch (e) {}
    }
  }

  useEffect(() => {
    if (!submissionResult) {
      navigate('/');
    }
  }, [submissionResult, navigate]);

  if (!submissionResult) {
    return null; // Will redirect shortly
  }

  const { case_id, analysis, similar_cases_count } = submissionResult;

  // Use empty arrays if Gemini fails to follow JSON strictly
  const rankedLeads = Array.isArray(analysis?.ranked_leads) ? analysis.ranked_leads : [];
  const blindSpotChecklist = Array.isArray(analysis?.blind_spot_checklist) ? analysis.blind_spot_checklist : [];

  // Build deduplicated matched cases from ranked leads (source_case is the link)
  const matchedCases = [];
  const seenSources = new Set();
  rankedLeads.forEach(lead => {
    if (lead.source_case && !seenSources.has(lead.source_case)) {
      seenSources.add(lead.source_case);
      // Collect all leads from this source for a summary
      const leadsFromSource = rankedLeads.filter(l => l.source_case === lead.source_case);
      const bestConfidence = Math.max(...leadsFromSource.map(l => l.confidence || 0));
      const topAction = leadsFromSource[0]?.action || 'No description';
      matchedCases.push({
        case_id: lead.source_case,
        confidence: bestConfidence,
        summary: topAction,
        lead_count: leadsFromSource.length,
        priority: leadsFromSource[0]?.priority || 'Low',
      });
    }
  });

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 pt-6 pb-24 h-full">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-2 mt-4">
        <h1 className="text-2xl font-normal text-textPrimary tracking-tight">Results for {case_id}</h1>
        <button 
          onClick={() => setShowMatchesPopup(true)}
          className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-1 rounded-full font-medium shadow-sm cursor-pointer hover:bg-green-100 hover:border-green-300 transition-colors"
        >
          {similar_cases_count} matches
        </button>
      </div>
      <div className="text-sm text-textSecondary mb-8">Retrieval complete &middot; {similar_cases_count} matches found</div>

      {/* Matches Popup */}
      {showMatchesPopup && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setShowMatchesPopup(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-border rounded-xl shadow-lg w-[480px] max-h-[520px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">
                  {similar_cases_count} Matched Cases
                </span>
              </div>
              <button 
                onClick={() => setShowMatchesPopup(false)} 
                className="text-textSecondary hover:text-textPrimary transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto max-h-[420px]">
              {matchedCases.length === 0 ? (
                <p className="text-sm text-textMuted italic text-center py-6">
                  No specific case matches could be extracted from the analysis. The AI found {similar_cases_count} similar cases in the vector store.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {matchedCases.map((mc, idx) => (
                    <div key={idx} className="bg-gray-50 border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center rounded-full shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-sm font-semibold text-textPrimary">Case #{mc.case_id}</span>
                        </div>
                        <div className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${
                          mc.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-200' :
                          mc.priority === 'Mid' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {mc.priority || 'Low'}
                        </div>
                      </div>
                      <p className="text-sm text-textSecondary leading-relaxed mb-2">{mc.summary}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-textMuted">{mc.lead_count} lead{mc.lead_count > 1 ? 's' : ''} sourced</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-textMuted">Confidence:</span>
                          <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${mc.confidence}%` }} />
                          </div>
                          <span className="text-xs font-medium text-blue-600">{mc.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* RANKED LEADS */}
      <div className="mb-8">
        <h2 className="text-[11px] font-bold tracking-widest uppercase text-textSecondary mb-4">Ranked Leads</h2>
        
        {rankedLeads.length === 0 && (
          <div className="bg-surface border border-border p-6 rounded-xl shadow-sm text-center">
            <span className="text-sm text-textMuted italic">No structured leads were returned by the AI analyzer.</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {rankedLeads.map((lead, idx) => {
            const isHigh = lead.priority === 'High';
            const isMid = lead.priority === 'Mid';
            
            return (
              <div key={idx} className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-5">
                  {/* Number Badge */}
                  <div className="w-8 h-8 bg-blue-50 text-blue-700 text-sm font-bold flex items-center justify-center rounded-full shrink-0">
                    {idx + 1}
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col">
                        <span className="text-base text-blue-800 font-medium hover:underline cursor-pointer">{lead.action}</span>
                        <span className="text-sm text-gray-500 mt-1">Sourced from Case #{lead.source_case}</span>
                      </div>
                      {/* Priority Badge */}
                      <div className={`text-xs px-3 py-1 rounded-full shrink-0 font-medium ${
                        isHigh ? 'bg-red-50 text-red-600 border border-red-200' : 
                        isMid ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                        'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {lead.priority || 'Low'}
                      </div>
                    </div>

                    {/* Confidence Bar */}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
                        <span>Confidence</span>
                        <span>{lead.confidence || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full" 
                          style={{ width: `${lead.confidence || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-border w-full mb-6"></div>

      {/* BLIND SPOT CHECKLIST */}
      <div className="mb-8">
        <h2 className="text-[11px] font-bold tracking-widest uppercase text-textSecondary mb-4">Blind Spot Checklist</h2>
        
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <ul className="flex flex-col gap-4">
            {blindSpotChecklist.length === 0 && (
              <li className="text-sm text-textMuted italic">No blind spots identified.</li>
            )}
            {blindSpotChecklist.map((item, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                </div>
                <span className="text-sm text-textPrimary leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI SUMMARY */}
      <div className="mb-8">
        <h2 className="text-[11px] font-bold tracking-widest uppercase text-textSecondary mb-4">AI Summary</h2>
        <div className="bg-surface border border-border p-6 rounded-xl shadow-sm">
          <p className="text-sm text-textPrimary leading-relaxed whitespace-pre-wrap">
            {analysis?.summary || "No summary provided."}
          </p>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-between px-8 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => navigate('/')} className="text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-gray-100 px-4 py-2 rounded-full transition-colors focus:outline-none">
          &larr; New case
        </button>
        {/* Pass case_id to Evidence Graph so it knows what to load */}
        <button onClick={() => navigate(`/graph?case_id=${encodeURIComponent(case_id)}`)} className="veritas-btn-primary flex items-center gap-2">
          View evidence graph &rarr;
        </button>
      </div>
    </div>
  );
}
