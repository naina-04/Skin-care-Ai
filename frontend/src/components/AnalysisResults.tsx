import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

export default function AnalysisResults({ results }: { results: any }) {
  if (!results) return null;

  return (
    <Card className="border-green-100 dark:border-green-900/50 shadow-sm bg-green-50/20 dark:bg-green-950/20 overflow-hidden">
      <CardHeader className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-6 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {results.filename}
        </CardTitle>
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
        <div className="mb-8">
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

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-green-100 dark:border-slate-800">
          <Button className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base font-medium text-primary-foreground">
            <FileText className="mr-2 h-5 w-5" />
            Generate Detailed Report
          </Button>
          <Button variant="outline" className="flex-1 bg-white dark:bg-slate-900 h-12 text-base font-medium border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Sparkles className="mr-2 h-5 w-5" />
            View AI Recommendations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
