# AI Facts

**Note:** LLMs can sometimes provide incorrect or outdated information. Always verify critical information through trusted sources.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-facts&env=OPENAI_API_KEY,DEEPGRAM_API_KEY,PERPLEXITY_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-facts%2Fblob%2Fmain%2F.env.example&demo-title=AI%20Facts&demo-description=Real-time%20fact%20checking%20using%20audio%20transcription%20and%20AI&demo-url=https%3A%2F%2Fai-facts.vercel.app)

This project is a Next.js application that performs real-time fact checking on spoken statements. It uses Deepgram for audio transcription and leverages both OpenAI and Perplexity to verify the accuracy of claims.

## Features

- Real-time Audio Transcription: Captures and transcribes spoken audio using Deepgram's API
- AI Fact Checking: Uses both OpenAI and Perplexity to cross-reference and verify statements
- Live Results: Shows fact-checking results in real-time as statements are processed
- Explanation of Validity: Provides detailed explanations for why statements are considered true or false

## Technology Stack

- [Next.js](https://nextjs.org/) for the frontend and API routes
- [AI SDK](https://sdk.vercel.ai/) for interacting with LLMs
- [Deepgram](https://deepgram.com/) for audio transcription
- [OpenAI](https://openai.com/) and [Perplexity](https://perplexity.ai/) for validating claims
- [ShadcnUI](https://ui.shadcn.com/) for UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling

## How It Works

1. Speak into microphone
2. Deepgram processes the audio stream in real-time and returns transcribed text
3. The transcribed text is analyzed for distinct statements ('?!.')
4. Each statement is sent to OpenAI and Perplexity for fact checking
5. The verification status and explanation are displayed to the user

## Getting Started

To get the project up and running, follow these steps:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

3. Add your API keys to the `.env` file:

   ```
   OPENAI_API_KEY=your_api_key_here
   DEEPGRAM_API_KEY=your_api_key_here
   PERPLEXITY_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

Your project should now be running on [http://localhost:3000](http://localhost:3000).

## Deployment

The project is set up for one-click deployment on Vercel. Use the "Deploy with Vercel" button above to create your own instance of the application.

## Learn More

To learn more about the technologies used in this project, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [AI SDK](https://sdk.vercel.ai/docs)
- [OpenAI](https://openai.com/)
- [Deepgram](https://deepgram.com/)
- [Perplexity AI](https://perplexity.ai/)
- [ShadcnUI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)