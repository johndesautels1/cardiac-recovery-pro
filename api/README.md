# API Documentation

This folder contains Vercel serverless functions for secure backend operations.

## Functions

### `/api/ai-evaluation`

**Purpose:** Generates AI-powered weekly progress evaluations for cardiac recovery patients.

**Method:** POST

**Request Body:**
```json
{
  "weeklyData": {
    "date": "2025-10-19",
    "vo2Max": 28.5,
    "restingHR": 65,
    "sdnn": 45,
    ...
  },
  "surgeryDate": "2025-08-15",
  "weeksPostOp": 9
}
```

**Response:**
```json
{
  "success": true,
  "evaluation": "Detailed AI evaluation text...",
  "timestamp": "2025-10-19T14:30:00.000Z"
}
```

## Security

- API keys are stored in Vercel environment variables, never in code
- All functions validate requests before processing
- CORS and rate limiting can be added as needed

## Setup

1. Add `ANTHROPIC_API_KEY` to Vercel environment variables
2. Deploy - Vercel automatically detects and deploys functions in `/api`
3. Call from frontend: `fetch('/api/ai-evaluation', { method: 'POST', ... })`

## Local Development

For local testing, create a `.env` file (NOT committed to Git):
```
ANTHROPIC_API_KEY=your_api_key_here
```

Then run: `vercel dev`
