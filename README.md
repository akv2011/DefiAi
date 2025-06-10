# DefiAi - DeFi AI Analytics Platform

A comprehensive DeFi AI application featuring real-time crypto analytics, sentiment analysis, and intelligent portfolio navigation. Built with advanced AI capabilities for seamless DeFi interactions including buy, stake, borrow, and withdraw operations through Aave and Morpho protocols.

## Key Features

🚀 **Real-Time Crypto Analytics** - Live market data and price movements
📊 **Sentiment Analysis** - AI-powered market sentiment tracking  
💼 **Portfolio Navigation** - Intelligent portfolio management and optimization
🔄 **DeFi Operations** - Buy, stake, borrow, and withdraw with Aave & Morpho integration
⚡ **Hyperliquid Integration** - Advanced stop-gap functionality for Hyperliquid
🤖 **AI-Powered Insights** - Smart recommendations and market analysis

## Technical Stack

### Frontend
- Next.js 14 with App Router
- TypeScript
- TailwindCSS
- shadcn/ui components
- React hooks for state management

### Backend & Integrations
- Vercel AI SDK
- Model Context Protocol (MCP)
- Aave Protocol integration
- Morpho Protocol integration
- Hyperliquid API integration
- LiFi SDK for cross-chain operations

### DeFi Features
- Real-time crypto analytics
- Sentiment analysis engine
- Portfolio tracking and optimization
- Multi-protocol lending/borrowing
- Cross-chain bridge functionality
- Stop-loss and risk management tools

## Setup and Development

1. Clone the repository

```bash
git clone https://github.com/[YOUR_USERNAME]/DefiAi.git
cd DefiAi
```

2. Install dependencies

```bash
pnpm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

Required environment variables:
- API keys for various DeFi protocols
- Hyperliquid API credentials
- OpenAI/Anthropic API keys for AI features
- Other configuration variables as needed

4. Run the development server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Code Style

This project uses ESLint and Prettier for code formatting. Please run the following commands before committing:

```bash
# Check linting issues
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make sure your code follows our style guidelines (run `pnpm lint:fix` and `pnpm format`)
4. Commit your changes
5. Push to the branch
6. Open a Pull Request

## License

MIT License - see LICENSE file for details

Commit trigger:
