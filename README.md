# RetinalAI — Eye Disease Detection App

AI-powered retinal scan analysis built with Next.js and Claude Vision API.

## Features
- Upload retinal fundus images (JPEG, PNG, WebP, BMP)
- AI-powered disease detection via Claude Vision
- Differential diagnosis with probability scores
- Detailed precautions and treatment recommendations
- Urgency assessment
- Professional dark medical UI

## Local Development

```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploying to Vercel

### Option 1: Vercel CLI
```bash
npm install -g vercel
vercel
# Follow prompts, then add env variable:
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

### Option 2: Vercel Dashboard
1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. In **Environment Variables**, add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (get one at console.anthropic.com)
4. Click **Deploy**

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (required) |

## Tech Stack
- **Frontend**: Next.js 14, React 18
- **AI**: Claude claude-opus-4-5 Vision API
- **Styling**: Custom CSS (no UI library)
- **Deployment**: Vercel

## Disclaimer
This application is for educational and research purposes only. It does not provide medical advice. Always consult a qualified ophthalmologist for diagnosis and treatment.
