// Demo responses for testing the AI assistant without API key
export const demoResponses: Record<string, string> = {
  "what are the main patterns in my data": `Based on your CSV data analysis, here are the key patterns I've identified:

**User Demographics & Status:**
• Mix of active (3) and inactive (2) users
• Age range from 22-35 years with average around 28
• Geographic distribution across major US cities (NY, LA, Chicago, Seattle)

**Data Quality Issues:**
• 3.3% missing data rate - specifically null email for Charlie Brown
• JSON metadata column contains rich user preferences and profile data

**User Preferences Patterns:**
• Theme preferences: 60% prefer dark mode, 40% light mode  
• Notification settings: 80% have notifications enabled
• Strong correlation between active status and notification preferences

**Recommendations:**
• Address the missing email data for user ID 5
• Consider flattening the JSON metadata for better analysis
• The dataset appears clean and well-structured overall`,

  "what cleaning steps do you recommend": `Here are my recommended data cleaning steps for your dataset:

**Priority 1: Missing Data**
• Handle the null email for Charlie Brown (user ID 5)
• Options: Remove row, interpolate, or mark as "unknown"
• Consider if missing email indicates incomplete registration

**Priority 2: JSON Column Processing**
• Flatten the metadata JSON column into separate fields:
  - preferences_theme
  - preferences_notifications  
  - profile_age
  - profile_city
• This will make analysis and querying much easier

**Priority 3: Data Standardization**
• Standardize city names (ensure consistent capitalization)
• Validate email formats using regex patterns
• Convert boolean preferences to consistent format

**Priority 4: Data Enhancement**
• Add data quality flags for completeness scoring
• Consider adding derived fields like age_group or region
• Validate date formats in created_at column

These steps will improve your data quality from 96.7% to near 100% completeness.`,

  "can you summarize the key statistics": `Here's a comprehensive summary of your dataset statistics:

**Dataset Overview:**
• File: sample_data.csv
• Total Records: 5 rows
• Total Columns: 6 fields
• Data Quality: 96.7% complete (1 missing value)

**Column Breakdown:**
• Text fields: 5 columns (id, name, email, status, created_at)
• Numeric fields: 0 columns
• JSON fields: 1 column (metadata)

**Missing Data Analysis:**
• Overall: 3.3% missing values
• Email field: 1 null value (20% of records)
• All other fields: 100% complete

**Status Distribution:**
• Active users: 60% (3 users)
• Inactive users: 40% (2 users)

**Data Insights from JSON Metadata:**
• Age range: 22-35 years
• Cities: 4 different locations
• Theme preferences: Mixed dark/light
• Notification settings: Mostly enabled

The dataset is relatively small but well-structured with rich metadata that could be flattened for enhanced analysis.`
};

export function getDemoResponse(message: string): string | null {
  const normalizedMessage = message.toLowerCase().trim();
  
  for (const [key, response] of Object.entries(demoResponses)) {
    if (normalizedMessage.includes(key)) {
      return response;
    }
  }
  
  return null;
}