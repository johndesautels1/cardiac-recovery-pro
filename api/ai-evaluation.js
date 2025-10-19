// Vercel Serverless Function for AI Weekly Progress Evaluation
// This function securely calls Anthropic API without exposing the API key to the client

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment variables (set in Vercel dashboard)
    const API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!API_KEY) {
        console.error('ANTHROPIC_API_KEY not found in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { weeklyData, surgeryDate, weeksPostOp } = req.body;

        if (!weeklyData) {
            return res.status(400).json({ error: 'Missing weeklyData in request' });
        }

        // Prepare the prompt for AI evaluation
        const prompt = `You are a cardiac recovery specialist AI assistant. Analyze the following weekly patient data and provide a comprehensive evaluation.

Patient Information:
- Weeks Post-Op: ${weeksPostOp || 'Not specified'}
- Surgery Date: ${surgeryDate || 'Not specified'}

Weekly Metrics:
${JSON.stringify(weeklyData, null, 2)}

Please provide:
1. Overall Progress Assessment (1-2 sentences)
2. Key Improvements (bullet points)
3. Areas of Concern (if any)
4. Specific Recommendations for next week
5. Motivational feedback

Keep the response professional but encouraging, suitable for a patient in cardiac recovery.`;

        // Call Anthropic API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Anthropic API error:', errorData);
            return res.status(response.status).json({
                error: 'AI service error',
                details: errorData
            });
        }

        const data = await response.json();

        // Return the AI evaluation
        return res.status(200).json({
            success: true,
            evaluation: data.content[0].text,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in AI evaluation:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
