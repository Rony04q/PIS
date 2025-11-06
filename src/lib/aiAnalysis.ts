// src/lib/aiAnalysis.ts

const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const ANALYSIS_MODEL = "llama3.1:8b-instruct-q4_K_M"; 

// 1. Define the structure of our AI's response
export type AnalysisResult = {
  fitScore: number;
  analysis: string;
  strengths: string[];
  missing: string[];
};

/**
 * Evaluates a resume against a job description using a local Ollama model.
 * @param resumeText The text of the resume.
 * @param jobDescriptionText The text of the job description.
 * @returns A promise that resolves to a structured AnalysisResult object.
 */
export async function evaluateResume(
  resumeText: string, 
  jobDescriptionText: string
): Promise<AnalysisResult | null> {
  
  // 2. Updated prompt to demand JSON
  const prompt = `
    You are an expert HR recruiter and professional resume analyst.
    Your task is to evaluate the following RESUME based on the provided JOB DESCRIPTION.
    You MUST respond with only a valid JSON object. Do not include any text, markdown, or formatting before or after the JSON.
    The JSON object must follow this exact format:
    {
      "fitScore": <a number between 0 and 100>,
      "analysis": "<a 2-3 sentence summary of why this candidate is or is not a good fit>",
      "strengths": ["<Strength 1>", "<Strength 2>", "..."],
      "missing": ["<Missing Skill 1>", "<Missing Skill 2>", "..."]
    }

    ---
    JOB DESCRIPTION:
    ${jobDescriptionText}
    ---
    RESUME:
    ${resumeText}
    ---
  `; // Note: We remove the final "ANALYSIS:" as we're requesting JSON

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        prompt: prompt,
        format: "json", // 3. Force Ollama to return valid JSON
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // 4. Parse the JSON string from the AI's response
    if (data.response) {
      const jsonResponse = JSON.parse(data.response);
      return jsonResponse as AnalysisResult;
    }
    return null;

  } catch (error: any) {
    console.error("Error evaluating resume with Ollama:", error.message);
    return null;
  }
}