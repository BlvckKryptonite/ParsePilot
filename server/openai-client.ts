import OpenAI from "openai";

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });
}

export interface ChatContext {
  fileName: string;
  rows: number;
  columns: number;
  stats?: any;
  preview?: any[];
}

export async function analyzeDataWithAI(message: string, context: ChatContext): Promise<string> {
  try {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    const systemPrompt = `You are an expert data analyst assistant helping users understand their CSV data. You provide clear, actionable insights about data patterns, quality issues, and recommendations.

Current dataset context:
- File: ${context.fileName}
- Rows: ${context.rows}
- Columns: ${context.columns}
- Statistics: ${context.stats ? JSON.stringify(context.stats, null, 2) : 'Not available'}
- Sample data: ${context.preview ? JSON.stringify(context.preview, null, 2) : 'Not available'}

Guidelines:
- Provide specific insights based on the actual data provided
- Suggest practical data cleaning and analysis steps
- Identify patterns, outliers, and data quality issues
- Keep responses concise but informative
- Use bullet points for clarity when listing multiple items
- If you notice missing data or anomalies, explain their potential impact
- Suggest appropriate visualizations or analysis methods when relevant`;

    const response = await openai!.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try rephrasing your question.";

  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    if (error.code === 'invalid_api_key') {
      throw new Error("Invalid OpenAI API key. Please check your configuration.");
    } else if (error.code === 'insufficient_quota') {
      throw new Error("OpenAI API quota exceeded. Please check your billing settings.");
    } else {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
}

export async function generateDataSummary(context: ChatContext): Promise<string> {
  const summaryMessage = `Please provide a comprehensive summary of this dataset, including key statistics, data quality observations, and initial insights.`;
  
  return analyzeDataWithAI(summaryMessage, context);
}