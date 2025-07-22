# CSV Data Cleaner Application

## Overview

This is a full-stack web application for cleaning and processing CSV files. The application allows users to upload CSV files, analyze their structure, clean the data using various options, flatten JSON columns, and export the cleaned data in multiple formats. It's built with a modern tech stack including React, Express, and PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **File Upload**: Multer middleware for handling CSV file uploads
- **Data Processing**: Python scripts for CSV analysis and processing
- **API Design**: RESTful endpoints with JSON responses

### Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM
- **Schema**: Two main tables - `csv_files` for metadata and `processed_data` for processing results
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Automated schema migrations with drizzle-kit
- **Storage Interface**: Abstracted storage layer with in-memory fallback for development

## Key Components

### File Upload System
- Drag-and-drop interface with react-dropzone
- File size limit of 100MB
- CSV format validation
- Progress tracking during upload

### Data Processing Pipeline
1. **CSV Analysis**: Python script analyzes structure, detects JSON columns, generates statistics
2. **Data Cleaning**: Configurable options for column normalization, missing data handling, and filtering
3. **JSON Flattening**: Extracts and flattens JSON data into separate columns
4. **Export**: Multiple format support (CSV, JSON, Excel)

### UI Components
- **File Upload**: Drag-and-drop with progress indication
- **Data Preview**: Tabular display with pagination and column type indicators
- **Data Cleaning**: Form-based configuration for cleaning options
- **JSON Flattening**: Interactive field selection for JSON columns
- **Insights Dashboard**: Charts and statistics using Recharts
- **Export Options**: Format selection and download functionality

### Storage Layer
- **IStorage Interface**: Abstracts database operations
- **MemStorage**: In-memory implementation for development
- **Database Storage**: Production implementation using Drizzle ORM
- **Schema Validation**: Zod schemas for type safety

## Data Flow

1. **Upload**: User uploads CSV file through the frontend
2. **Analysis**: Backend processes file with Python script to extract metadata
3. **Storage**: File metadata and preview data stored in PostgreSQL
4. **Cleaning**: User configures cleaning options through the UI
5. **Processing**: Backend applies cleaning transformations
6. **Flattening**: Optional JSON column flattening based on user selection
7. **Export**: Processed data exported in user's preferred format

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form
- **UI Library**: Radix UI primitives, Lucide React icons
- **Data Fetching**: TanStack Query for server state management
- **Styling**: Tailwind CSS, class-variance-authority for component variants
- **Charts**: Recharts for data visualization
- **Utilities**: date-fns for date handling, clsx for conditional classes

### Backend Dependencies
- **Express.js**: Web framework with middleware support
- **Database**: Drizzle ORM, @neondatabase/serverless for PostgreSQL
- **File Handling**: Multer for file uploads
- **Validation**: Zod for schema validation
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Python Dependencies
- **pandas**: CSV data processing and analysis
- **json**: JSON parsing and validation
- **sys/os**: System operations and file handling

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **Backend**: tsx for running TypeScript directly
- **Database**: Local PostgreSQL or Neon serverless
- **Python**: Direct script execution via child_process

### Production Build
- **Frontend**: Vite build to static assets in `dist/public`
- **Backend**: esbuild compilation to `dist/index.js`
- **Database**: PostgreSQL with connection pooling
- **File Storage**: Local filesystem with configurable upload directory

### Configuration
- **Environment Variables**: DATABASE_URL for database connection
- **Build Scripts**: Separate development and production configurations
- **Type Checking**: TypeScript compilation validation
- **Database Migrations**: Drizzle push for schema updates

The application is designed to be easily deployable on platforms like Replit, with proper environment variable configuration and database provisioning through Neon or similar PostgreSQL providers.

## Recent Changes: Latest modifications with dates

### 2025-01-21: Enhanced Intelligent Data Cleaning Features
- **Implemented smart missing data handling**: Added mean/median/mode fill options with automatic numeric column detection
- **Added comprehensive string cleaning**: Trim whitespace, lowercase conversion, punctuation removal for better data consistency
- **Enhanced column normalization**: Extended snake_case conversion with special character removal and whitespace trimming
- **Created advanced filtering options**: Row filtering by column values with multiple operators (equals, contains, greater than, etc.)
- **Built cleaning report component**: Comprehensive reports showing operations applied, rows/columns affected, and downloadable summaries
- **Integrated cleaning pipeline**: Full end-to-end processing with JSON flattening, smart cleaning, and detailed reporting
- **Enhanced user interface**: New intelligent cleaning options with conditional field selection and operation previews
- **Fixed critical export bug**: Export functionality now uses cleaning options from request body instead of stored options
- **GPT-powered chat assistant**: Implemented AI assistant for data explanation, insights, pattern analysis, and cleaning recommendations
- **Tabbed interface redesign**: Reorganized UI with dedicated tabs for Preview, AI Assistant, Insights, Cleaning, and Export
- **Professional documentation**: Created comprehensive README.md with technical challenges, architecture details, and usage guide
- **GitHub integration preparation**: Enhanced .gitignore and prepared project for professional repository hosting
- **Critical missing data bug fix**: Enhanced missing data detection to catch N/A, null, -, ?, whitespace-only values and other common missing indicators
- **Comprehensive cleaning verification**: Tested with real messy data - successfully removes rows with missing data while preserving complete records
- **State management fix**: Fixed critical bug where cleaning options wouldn't persist when switching between tabs - now uses proper parent-level state management
- **Enhanced user interface**: Added dedicated "Save Changes" and "Download Clean Data" buttons in cleaning section for better workflow
- **Project cleanup**: Removed all development test CSV files, keeping only essential project files and user's original test data
- **GitHub deployment success**: Successfully uploaded clean project to GitHub repository after resolving git configuration conflicts
- **Repository established**: ParsePilot is now live at https://github.com/BlvckKryptonite/ParsePilot with all production-ready code