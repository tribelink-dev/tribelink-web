# AI-Powered Scheduling Engine (Gumo.ai-like)

This project now includes an AI-powered scheduling engine similar to Gumo.ai that intelligently optimizes trip schedules using OpenAI's GPT models.

## Features

### 🤖 AI-Powered Scheduling
- **Intelligent Optimization**: Uses OpenAI GPT-4o-mini to create optimized trip schedules
- **Multi-Factor Analysis**: Considers location, time, preferences, ratings, and budget
- **Smart Recommendations**: AI-powered suggestions for free days
- **Fallback System**: Automatically falls back to rule-based optimization if AI is unavailable

### 🎯 Optimization Factors
1. **Travel Distance**: Minimizes travel time between activities
2. **Location Grouping**: Groups activities by location to reduce transportation
3. **Pace Matching**: Respects user's pace preference (fast/slow)
4. **Budget Balance**: Optimizes for budget while maintaining quality
5. **Time Flow**: Ensures logical flow from morning to evening
6. **Rating & Popularity**: Considers experience ratings and reviews

## Setup

### 1. Install Dependencies
The required `axios` package is already included in `package.json`.

### 2. Configure OpenAI API Key

Add your OpenAI API key to your `.env` file:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Note**: The AI scheduler will automatically fall back to intelligent rule-based optimization if the API key is not provided.

### 3. Usage

The AI scheduler is automatically integrated into the trip scheduling endpoint:

```javascript
POST /api/trips/schedule
```

The scheduler will:
1. First try to use AI optimization (if API key is available)
2. Fall back to intelligent rule-based optimization if AI fails
3. Always provide a valid schedule

## API Response

The schedule response now includes AI insights:

```json
{
  "tripId": "...",
  "schedule": [...],
  "totalPrice": 500,
  "aiInsights": [
    "Activities grouped by location to minimize travel",
    "Schedule optimized for fast pace preference"
  ],
  "optimizationScore": 0.92
}
```

## AI Recommendations

Free day recommendations also use AI when available:

```javascript
POST /api/trips/recommendations
```

Response includes `source: 'ai'` when AI recommendations are used, or `source: 'rule-based'` for fallback.

## Cost Optimization

The scheduler uses `gpt-4o-mini` which is cost-effective:
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- Typical schedule generation: ~500-1000 tokens

## Architecture

```
┌─────────────────┐
│  Trip Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Scheduler    │◄─── OpenAI API (if available)
│  (aiScheduler)  │
└────────┬────────┘
         │
         ├───► AI Optimization (if API key available)
         │
         └───► Rule-based Optimization (fallback)
                  │
                  ▼
         ┌─────────────────┐
         │  Base Scheduler │
         │  (scheduler)    │
         └─────────────────┘
```

## Customization

### Adjust AI Model
Edit `backend/services/aiScheduler.js`:

```javascript
model: 'gpt-4o-mini', // Change to 'gpt-4' for better quality (higher cost)
```

### Adjust Temperature
Lower temperature (0.1-0.3) = more consistent, logical schedules
Higher temperature (0.5-0.7) = more creative, varied schedules

```javascript
temperature: 0.3, // Current setting
```

## Monitoring

Check logs for AI scheduler status:
- `🤖 AI Scheduler (Gumo.ai-like) starting...` - AI scheduler initiated
- `✅ AI optimization applied` - AI optimization successful
- `AI optimization failed, using base schedule` - Fallback to rule-based

## Future Enhancements

Potential improvements:
- [ ] Learning from user feedback
- [ ] Weather-based optimization
- [ ] Real-time traffic integration
- [ ] Multi-language support
- [ ] Personalized style learning
- [ ] Group trip optimization

## Troubleshooting

### AI Not Working?
1. Check if `OPENAI_API_KEY` is set in `.env`
2. Verify API key is valid
3. Check API quota/balance
4. Review error logs for specific issues

### Fallback to Rule-Based?
The system automatically falls back if:
- API key is missing
- API request fails
- Rate limits exceeded
- Invalid response format

This ensures the system always provides a schedule, even without AI.

