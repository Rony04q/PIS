// src/pages/ResumeEvaluatorPage.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { evaluateResume, AnalysisResult } from '../lib/aiAnalysis';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';

export function ResumeEvaluatorPage() {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!jobDescription || !resume) {
      setError("Please paste both a job description and a resume.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null); 
    
    try {
      const result = await evaluateResume(resume, jobDescription);
      
      if (result) {
        setAnalysisResult(result);
      } else {
        setError('Error: Could not get analysis from AI model. Is Ollama running?');
      }
    } catch (err: any) {
      console.error("Parsing Error:", err);
      setError(err.message || 'An error occurred while parsing the AI response. Check console.');
    }
    
    setIsLoading(false);
  };

  // This function is still used for the score color (red/yellow/green)
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // We are keeping the <div> structure to work inside your AdminLayout
  return (
    <div className="container mx-auto">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/admin')}
        // CHANGED: Specific blue color
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors px-0"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Home
      </Button>

      {/* CHANGED: Specific blue color and bolder font */}
      <h1 className="text-3xl font-extrabold tracking-tight mb-6 text-blue-900">
        AI Resume Evaluator
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Column (Cards are white by default) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste the full job description here..."
                className="h-48"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={isLoading}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Candidate's Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste the full resume text here..."
                className="h-64"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                disabled={isLoading}
              />
            </CardContent>
          </Card>
          
          <Button 
            onClick={handleEvaluate} 
            disabled={isLoading}
            // CHANGED: Specific blue background and white text
            className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Evaluating..." : "Evaluate Resume"}
          </Button>
        </div>

        {/* Output Column */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Analysis Result</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex flex-col justify-center items-center h-64">
                  {/* CHANGED: Specific blue spinner */}
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  {/* CHANGED: Neutral gray color */}
                  <p className="text-gray-600">Thinking... (This may take a moment)</p>
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {analysisResult && (
                <div className="space-y-6">
                  {/* Fit Score */}
                  <div>
                    {/* CHANGED: Neutral gray color */}
                    <Label className="text-sm font-medium text-gray-500">Fit Score</Label>
                    <p className={`text-6xl font-bold ${getScoreColor(analysisResult.fitScore)}`}>
                      {analysisResult.fitScore}
                      {/* CHANGED: Neutral gray color */}
                      <span className="text-3xl text-gray-400">/100</span>
                    </p>
                  </div>
                  
                  {/* Analysis Summary */}
                  <div>
                    {/* CHANGED: Neutral gray color */}
                    <Label className="text-sm font-medium text-gray-500">Analysis</Label>
                    {/* CHANGED: Neutral dark gray text */}
                    <p className="text-gray-800 leading-relaxed">{analysisResult.analysis}</p>
                  </div>

                  {/* Key Strengths */}
                  <div>
                    {/* CHANGED: Neutral gray color */}
                    <Label className="text-sm font-medium text-gray-500">Key Strengths</Label>
                    <ul className="list-none space-y-2 mt-2">
                      {analysisResult.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                          {/* CHANGED: Neutral dark gray text */}
                          <span className="text-gray-800">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    {/* CHANGED: Neutral gray color */}
                    <Label className="text-sm font-medium text-gray-500">Missing Keywords/Skills</Label>
                    <ul className="list-none space-y-2 mt-2">
                      {analysisResult.missing.map((skill, index) => (
                        <li key={index} className="flex items-start">
                          <XCircle className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                          {/* CHANGED: Neutral dark gray text */}
                          <span className="text-gray-800">{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Placeholder */}
              {!isLoading && !analysisResult && !error && (
                // CHANGED: Neutral gray color
                <p className="text-gray-500 h-64 flex items-center justify-center">
                  Click "Evaluate Resume" to see the AI analysis here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ResumeEvaluatorPage;