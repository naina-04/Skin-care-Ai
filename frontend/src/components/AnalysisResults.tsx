import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle2, FileText, Sparkles, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import ReactMarkdown from 'react-markdown';
import { translateText } from '../utils/translate';

export default function AnalysisResults({ 
  results, 
  preview, 
  doctorNotes, 
  setDoctorNotes,
  reportLanguage 
}: { 
  results: any, 
  preview: string | null,
  doctorNotes: string,
  setDoctorNotes: (notes: string) => void,
  reportLanguage: string
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [englishReport, setEnglishReport] = useState<string | null>(null);
  const [detailedReport, setDetailedReport] = useState<string | null>(null);

  if (!results) return null;

  const handleCopyAIToNotes = () => {
    if (detailedReport) {
      setDoctorNotes(detailedReport);
      setIsModalOpen(false);
    }
  };

  // Reset cached report whenever a new skin scan / condition result is loaded
  React.useEffect(() => {
    setEnglishReport(null);
    setDetailedReport(null);
  }, [results?.filename, results?.primary?.condition]);

  React.useEffect(() => {
    const runTranslation = async () => {
      if (!englishReport) return;
      if (reportLanguage === 'en') {
        setDetailedReport(englishReport);
        return;
      }
      setIsTranslating(true);
      const translated = await translateText(englishReport, reportLanguage);
      setDetailedReport(translated);
      setIsTranslating(false);
    };
    runTranslation();
  }, [reportLanguage, englishReport]);

  const handleGenerateAIReport = async (forceRetry = false) => {
    setIsModalOpen(true);
    
    // Only generate if we don't have a report at all (unless force retry requested)
    if (englishReport && !forceRetry) return;
    
    setIsGenerating(true);
    setDetailedReport(null);
    setReportLanguage('en');
    
    try {
      const condition = results.primary.condition;
      const severity = results.secondary.severity || 'Unknown';
      const prompt = `Act as an expert dermatologist. The patient's AI skin scan just detected "${condition}" with high confidence. The secondary risk severity is evaluated as "${severity}". 

CRITICAL REQUIREMENT: You must respond ONLY in English. Do not include any foreign language characters, symbols, or unreadable text under any circumstances.

Please provide a detailed clinical overview structured exactly as follows using Markdown:

### Overview & Causes
A paragraph explaining the condition and its common causes.

### Lifestyle Changes
A paragraph detailing recommended lifestyle adjustments.

### Specific Prescriptions
Explicitly list specific examples of medications (creams, ointments, sunscreens, or oral tablets) that are commonly prescribed for this condition. Format these prescriptions as a clear, easy-to-read bulleted list. This section must be highly distinct and detailed.`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      // Route the detailed report generation through our Express backend to secure credentials and bypass CORS
      const response = await fetch('http://localhost:5000/api/analyze/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({ condition, severity }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMsg = errorData.error;
          }
        } catch (e) {
          // keep default errorMsg
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const content = data.report;
      setEnglishReport(content);
      setDetailedReport(content);
    } catch (error: any) {
      console.error(error);
      const isAbort = error.name === 'AbortError';
      const msg = isAbort ? 'Request timed out. Please refresh the page and try again.' : error.message;
      setDetailedReport(`An error occurred: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card className="border-green-100 dark:border-green-900/50 shadow-sm bg-green-50/20 dark:bg-green-950/20 overflow-hidden">
        <CardHeader className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-6 py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            {preview && (
              <div className="w-12 h-12 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 bg-slate-50 dark:bg-slate-800">
                <img src={preview} alt="Analyzed Skin" className="w-full h-full object-cover" />
              </div>
            )}
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate max-w-[200px] sm:max-w-xs">
              {results.filename}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-sm bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full border border-green-200 dark:border-green-800/50">
            <CheckCircle2 className="h-4 w-4" />
            Complete
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Skin Type Analysis */}
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">Skin Type Analysis</h3>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{results.primary.condition}</span>
                  <span className="text-sm font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded">
                    {results.primary.confidence}%
                  </span>
                </div>
                <Progress value={results.primary.confidence} className="h-2 mb-4 bg-slate-100 dark:bg-slate-800" />
                
                <div className="space-y-2 mt-4 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Overall Confidence:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">91%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detected Conditions */}
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">Detected Conditions</h3>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[120px]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 block mb-1">{results.secondary.condition}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">Severity: {results.secondary.severity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                      {results.secondary.confidence}%
                    </span>
                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">High</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-8" id="recommendations">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">Recommendations</h3>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <ul className="space-y-3">
                {results.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Doctor Notes / Custom Prescription */}
          <div className="mb-8 print:hidden">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">Doctor Notes / Custom Prescription (Optional)</h3>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Type any specific prescriptions, creams, sunscreens, or custom clinical notes to attach to the final PDF report..."
              className="w-full h-32 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm resize-y"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-green-100 dark:border-slate-800 print:hidden">
            <Button 
              onClick={() => window.print()}
              className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base font-medium text-primary-foreground"
            >
              <FileText className="mr-2 h-5 w-5" />
              Generate Detailed Report (PDF)
            </Button>
            <Button 
              onClick={handleGenerateAIReport}
              variant="outline" 
              className="flex-1 bg-white dark:bg-slate-900 h-12 text-base font-medium border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Sparkles className="mr-2 h-5 w-5 text-green-600" />
              View AI Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deep-Dive AI Recommendations Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Clinical Deep Dive</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 flex-1">
              {isGenerating || isTranslating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-green-600 mb-4" />
                  <p className="font-medium">{isTranslating ? 'Translating Report...' : 'Consulting AI Specialist...'}</p>
                  <p className="text-sm mt-2 text-center max-w-sm text-slate-500">
                    {isTranslating ? 'Translating medical terminology securely...' : 'Generating a highly detailed, clinical overview of the detected conditions...'}
                  </p>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  {detailedReport && !detailedReport.startsWith('An error occurred:') ? (
                    <ReactMarkdown 
                      components={{
                        h3: ({node, ...props}) => <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800 pb-2" {...props} />,
                        p: ({node, ...props}) => <p className="text-slate-700 dark:text-slate-300 text-justify mb-5 leading-relaxed" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 mb-5" {...props} />,
                        li: ({node, ...props}) => <li className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />
                      }}
                    >
                      {detailedReport}
                    </ReactMarkdown>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-red-500 font-semibold mb-2">
                        {detailedReport || 'Failed to load content.'}
                      </p>
                      <p className="text-sm text-slate-500 mb-6">
                        Ensure the Express backend (Port 5000) is running and your API keys are active.
                      </p>
                      <Button onClick={() => handleGenerateAIReport(true)} className="bg-primary hover:bg-primary/90">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Retry AI Report Generation
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
              {detailedReport && (
                <Button onClick={handleCopyAIToNotes} className="bg-primary hover:bg-primary/90">
                  <FileText className="h-4 w-4 mr-2" />
                  Attach to Final PDF Report
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
