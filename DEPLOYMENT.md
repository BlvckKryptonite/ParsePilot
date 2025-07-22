# ParsePilot Deployment Guide

## Architecture Overview
ParsePilot is a **Node.js application** with Express backend that uses Python scripts for CSV processing.

- **Primary Runtime**: Node.js + Express
- **Frontend**: React + Vite
- **Python Usage**: CSV processing scripts called via child_process
- **Database**: PostgreSQL (optional, uses in-memory storage by default)

## Render Deployment

### Prerequisites
- GitHub repository: https://github.com/BlvckKryptonite/ParsePilot
- Render account

### Deployment Steps
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use these settings:
   - **Environment**: Node
   - **Build Command**: `npm install && pip install -r python-requirements.txt && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18+ (recommended)

### Environment Variables
- `NODE_ENV`: production
- `DATABASE_URL`: (optional, for PostgreSQL)
- `OPENAI_API_KEY`: (optional, for AI features)

### Files Included
- `python-requirements.txt`: Python dependencies (pandas, openpyxl)
- `render.yaml`: Render configuration
- `package.json`: Node.js dependencies and scripts

## Alternative: Vercel/Netlify
For static deployment, you can also deploy the frontend separately:
1. Build: `npm run build`
2. Deploy the `dist` folder
3. Set up serverless functions for the API endpoints

## Important Notes
- This is NOT a Flask application
- Main server runs on Express (Node.js)
- Python scripts are called as child processes
- Ensure both Node.js and Python are available in your deployment environment