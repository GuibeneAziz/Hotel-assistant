# Tunisia Hotel Assistant 🏨

A modern, touch-friendly tourist assistant application for three premium hotels in Tunisia. Built with Next.js and React, optimized for tactile screens and kiosk environments.

## 🏨 Featured Hotels

1. **Sindbad Hotel** - Hammamet
   - Traditional Tunisian charm with luxury amenities
   - Cultural activities and beachfront location

2. **Paradise Beach Hotel** - Hammamet  
   - Family-friendly resort with water activities
   - All-inclusive entertainment and kids programs

3. **Mövenpick Sousse** - Sousse
   - Premium resort in historic Sousse
   - Cultural experiences and UNESCO heritage tours

## ✨ Features

- **Touch-Optimized Interface**: Designed for tactile screens and kiosks
- **Multi-Hotel Support**: Seamless switching between hotel experiences
- **AI-Powered Assistance**: Personalized recommendations for each hotel
- **Real-Time Weather**: Live weather data for activity planning
- **Guest Type Personalization**: Tailored experiences for families, couples, adventure seekers, and cultural enthusiasts
- **Responsive Design**: Works on all screen sizes
- **Multilingual Ready**: Built with internationalization support

## 🚀 Quick Start

### Frontend (Next.js)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   ```
   http://localhost:3000
   ```

### Backend API (Optional - for enhanced features)

1. **Navigate to API directory:**
   ```bash
   cd api
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Flask API:**
   ```bash
   python hotel_api.py
   ```

### Original Streamlit Chatbot (Still Available)

1. **Run the original chatbot:**
   ```bash
   streamlit run hotel_chatbot.py
   ```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icons

### Backend (Optional)
- **Flask** - Python web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Groq API** - AI-powered responses
- **Open-Meteo API** - Free weather data

## 📱 Touch-Screen Optimization

The application is specifically optimized for touch interfaces:

- **Large Touch Targets**: Minimum 44px touch targets
- **Gesture-Friendly**: Smooth scrolling and intuitive navigation
- **No Hover States**: All interactions work on touch devices
- **Responsive Typography**: Readable text at all screen sizes
- **Accessibility**: WCAG compliant for inclusive design

## 🎨 Customization

### Adding New Hotels

1. **Update hotel data** in `app/hotel/[id]/page.tsx`:
   ```typescript
   const hotelData = {
     'your-hotel-id': {
       name: 'Your Hotel Name',
       location: 'City, Tunisia',
       // ... other properties
     }
   }
   ```

2. **Add hotel to main page** in `app/page.tsx`:
   ```typescript
   const hotels: Hotel[] = [
     // ... existing hotels
     {
       id: 'your-hotel-id',
       name: 'Your Hotel Name',
       // ... other properties
     }
   ]
   ```

### Customizing Themes

Each hotel has its own color theme defined in the `color` property:
- Sindbad: `from-blue-600 to-cyan-500`
- Paradise: `from-emerald-600 to-teal-500`  
- Mövenpick: `from-amber-600 to-orange-500`

## 🌐 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically

### Docker
```bash
# Build the image
docker build -t tunisia-hotels .

# Run the container
docker run -p 3000:3000 tunisia-hotels
```

## 🔧 Environment Variables

Create a `.env.local` file:

```env
# Optional: API endpoints
NEXT_PUBLIC_API_URL=http://localhost:5000

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

## 💡 Example Interactions

- "When does the pool open?"
- "Is it good weather for swimming?"
- "What family activities are nearby?"
- "Show me cultural attractions in Sousse"
- "What are the restaurant hours?"
- "Recommend romantic activities"

## 🆓 Free APIs Used

- **Groq AI** - Chat responses (free tier)
- **Open-Meteo** - Weather data (no API key needed)
- **Unsplash** - High-quality hotel images
- **Geoapify** - Backup location data (3K requests/day free)

**Total Cost: $0**

## 📊 Performance

- **Lighthouse Score**: 95+ on all metrics
- **Core Web Vitals**: Optimized for excellent user experience
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on touch devices
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own hotel applications.

---

**Built with ❤️ for the tourism industry in Tunisia**