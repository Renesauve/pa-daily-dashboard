# Port Alberni Daily Dashboard

A simple, responsive web application providing daily information for Port Alberni, BC.

## Features

- **Ferry Schedules**: Real-time BC Ferries departure times with countdown timers
- **Gas Prices**: Weekly updated fuel prices for local stations
- **Weather**: Current conditions for Port Alberni

## Tech Stack

- Next.js 15 with TypeScript
- Tailwind CSS
- Government of Canada APIs

## Getting Started

```bash
git clone https://github.com/Renesauve/pa-daily-dashboard.git
cd pa-daily-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

- `/api/ferry` - BC Ferries departure data
- `/api/gas-prices` - Government of Canada fuel prices
- `/api/weather` - Port Alberni weather conditions

## Deployment

Pre-configured for Netlify deployment with included `netlify.toml`.

## Contributing

Pull requests welcome!
