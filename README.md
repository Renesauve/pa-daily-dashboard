# PA Daily Dashboard

The unofficial homepage for Port Alberni, BC! A beautiful dashboard showing live weather, ferry schedules, gas prices, traffic, events, community posts, and power outages.

## 🚀 Quick Start

1. **Clone and setup:**

   ```bash
   cd pa-daily-dashboard
   npm install
   npm run dev
   ```

2. **Visit:** http://localhost:3000

## 🔑 API Configuration

### Weather API (OpenWeatherMap)

1. Get free API key from [openweathermap.org](https://openweathermap.org/api)
2. Add to your Netlify environment variables:
   ```
   OPENWEATHER_API_KEY=your_api_key_here
   ```

### Google OAuth (For User Login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add these environment variables:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   NEXTAUTH_SECRET=your_random_secret_key
   NEXTAUTH_URL=https://your-domain.netlify.app
   ```

### Netlify DB Setup

1. Connect your app to Netlify
2. Enable Netlify DB (Neon integration)
3. Run the migration function:
   ```
   curl https://your-app.netlify.app/.netlify/functions/migrate
   ```

## 📊 Features

### Live Data Widgets

- **Weather**: Real OpenWeatherMap data with 15-min caching
- **Ferry**: BC Ferries schedules (seasonal routes)
- **Gas Prices**: Local station prices
- **Traffic**: Real-time conditions
- **Events**: Community calendar
- **Community**: User posts and discussions
- **Power**: BC Hydro outage info

### Smart Caching

- API responses cached in Netlify DB
- Reduces API costs to under $20/month
- Fresh data every 15-30 minutes depending on widget

### Analytics & Revenue

- Track widget usage for ad optimization
- User behavior analytics
- Premium user management
- Ad placement tracking

## 💰 Revenue Streams

1. **Google AdSense**: $100-300/month
2. **Premium Alerts**: $2.99/month subscription
3. **Local Business Ads**: $50-200/month per business
4. **Affiliate Links**: Gas, hotels, restaurants

**Projected Revenue**: $500-2000/month after 6 months

## 🗄️ Database Schema

### Users Table

- User management and premium subscriptions
- Notification preferences
- Location settings

### Analytics Table

- Widget clicks and views
- User behavior tracking
- Revenue optimization data

### API Cache Table

- Smart caching for cost optimization
- 15-30 minute refresh cycles
- Source tracking

### Community Posts Table

- User-generated content
- Local discussions and tips
- Event sharing

### User Preferences Table

- Personalized widget layouts
- Favorite locations
- Custom alerts

## 🚀 Deployment

1. **Connect to Netlify:**

   ```bash
   netlify link
   ```

2. **Deploy:**

   ```bash
   netlify deploy --prod --dir=.next
   ```

3. **Setup Environment Variables in Netlify:**

   - OPENWEATHER_API_KEY
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL

4. **Run Database Migration:**
   Visit: `https://your-app.netlify.app/.netlify/functions/migrate`

## 📈 Growth Strategy

### Month 1-2: Foundation

- Launch with demo data
- Get 100+ daily users
- Basic SEO optimization

### Month 3-4: Monetization

- Add Google AdSense
- Launch premium subscriptions
- Partner with 2-3 local businesses

### Month 5-6: Scale

- Add more widgets based on analytics
- Optimize ad placement
- Expand to nearby communities

### Target: $2000-5000/month by month 12

## 🎯 Why This Will Work

1. **Port Alberni is perfect size** (17k people) - large enough for revenue, small enough to dominate
2. **Everyone needs this info daily** - weather, ferries, gas prices are universal needs
3. **No competition** - currently no local dashboard exists
4. **Network effects** - more users = more community content = more value
5. **Multiple revenue streams** - not dependent on just ads

## 🔧 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Netlify Functions
- **Database**: Netlify DB (Neon PostgreSQL)
- **Auth**: NextAuth with Google OAuth
- **Hosting**: Netlify
- **Analytics**: Built-in + Google Analytics

## 🤝 Contributing

This is a business project, but community suggestions are welcome! Open an issue to suggest new widgets or features that would help Port Alberni residents.

---

**Built with ❤️ for Port Alberni, BC**
