# Quick Reference Guide - Visual Overview

## 🎯 What Does Each File Do? (Simple Version)

### **Files You Should Know**

#### 1. `app/page.tsx` - Homepage
```
┌─────────────────────────────────┐
│   Tunisia Hotel Assistant       │
│                                 │
│  [Sindbad Hotel Card]           │
│  [Paradise Beach Card]          │
│  [Mövenpick Sousse Card]        │
│                                 │
│  [Admin Button]                 │
└─────────────────────────────────┘
```
**What it does**: Shows hotel selection screen

---

#### 2. `app/hotel/[id]/page.tsx` - Chatbot
```
┌─────────────────────────────────┐
│  ← Back    Sindbad Hotel   🌤️  │
├─────────────────────────────────┤
│  [Hotel Image Banner]           │
├─────────────────────────────────┤
│  Bot: Welcome! How can I help?  │
│                                 │
│           User: Pool hours? 👤  │
│                                 │
│  Bot: Pool open 6am-10pm 🏊     │
├─────────────────────────────────┤
│  [Type message...] [Send]       │
└─────────────────────────────────┘
```
**What it does**: Chat interface for guests

---

#### 3. `app/dashboard/page.tsx` - Admin Panel
```
┌─────────────────────────────────┐
│  Hotel Admin Dashboard          │
│  [Select Hotel ▼]               │
├─────────────────────────────────┤
│  [Facilities] [Restaurant]      │
│  [Events] [Amenities] [Contact] │
├─────────────────────────────────┤
│  Pool: ☑️ Available             │
│  Open: [06:00] Close: [22:00]   │
│                                 │
│  Special Events:                │
│  + Add Event                    │
│  • Beach Party - Feb 15         │
│                                 │
│  [Save Changes]                 │
└─────────────────────────────────┘
```
**What it does**: Admin manages hotel settings

---

#### 4. `app/api/hotel-settings/route.ts` - API
```
┌─────────────────────────────────┐
│         API ENDPOINT            │
│                                 │
│  GET  → Read settings           │
│  POST → Save settings           │
│                                 │
│  ↕️                              │
│  hotel-settings.json            │
└─────────────────────────────────┘
```
**What it does**: Connects frontend to data file

---

#### 5. `data/hotel-settings.json` - Database
```json
{
  "sindbad-hammamet": {
    "pool": { "available": true, "openTime": "06:00" },
    "specialEvents": [...]
  }
}
```
**What it does**: Stores all hotel data

---

## 🔄 How Data Flows

### Scenario 1: Guest Asks About Pool
```
1. Guest types "pool hours?"
   ↓
2. Chatbot detects keyword "pool"
   ↓
3. Fetches data from API
   ↓
4. API reads hotel-settings.json
   ↓
5. Returns: "Pool open 6am-10pm"
   ↓
6. Chatbot displays answer
```

### Scenario 2: Admin Adds Event
```
1. Admin fills event form
   ↓
2. Clicks "Save Changes"
   ↓
3. Dashboard sends POST to API
   ↓
4. API writes to hotel-settings.json
   ↓
5. Success message shown
   ↓
6. Event now visible in chatbot
```

---

## 📊 Project Structure (Simplified)

```
Your Project
│
├── app/                    ← All pages live here
│   ├── page.tsx           ← Homepage (hotel selection)
│   ├── dashboard/         ← Admin panel
│   ├── hotel/[id]/        ← Chatbot for each hotel
│   └── api/               ← Backend API
│
├── data/                   ← Data storage
│   └── hotel-settings.json ← All hotel info
│
├── package.json            ← Dependencies list
└── next.config.js          ← Next.js settings
```

---

## 🎨 Technologies Used (What They Do)

| Technology | Purpose | Example |
|------------|---------|---------|
| **Next.js** | Framework that runs everything | Like WordPress but for React |
| **React** | Creates interactive UI | Buttons, forms, animations |
| **TypeScript** | JavaScript with types | Prevents bugs, better autocomplete |
| **Tailwind CSS** | Styling | `bg-blue-500` = blue background |
| **Framer Motion** | Animations | Smooth transitions, fades |
| **Lucide React** | Icons | ⚙️ 🏊 🍽️ icons |

---

## 🔑 Key Files to Modify

### Want to change homepage design?
→ Edit `app/page.tsx`

### Want to change chatbot responses?
→ Edit `app/hotel/[id]/page.tsx`
→ Look for functions: `getHotelInfo()`, `getActivityRecommendations()`

### Want to change admin dashboard?
→ Edit `app/dashboard/page.tsx`

### Want to add new hotel data fields?
→ Edit `data/hotel-settings.json`
→ Update `app/api/hotel-settings/route.ts`

### Want to change colors/styling?
→ Edit `tailwind.config.js`
→ Or use Tailwind classes in components

---

## 🚀 Common Tasks

### Add a New Hotel
1. Edit `app/page.tsx` - add hotel card
2. Edit `app/hotel/[id]/page.tsx` - add to `hotelData` object
3. Edit `data/hotel-settings.json` - add hotel settings
4. Edit `app/dashboard/page.tsx` - add to hotel selector

### Add New Chatbot Feature
1. Open `app/hotel/[id]/page.tsx`
2. Add keyword detection in `getHotelInfo()`
3. Add response logic
4. Test in chatbot

### Add New Admin Setting
1. Open `data/hotel-settings.json` - add field
2. Open `app/dashboard/page.tsx` - add form input
3. Test saving and loading

---

## 🐛 Troubleshooting

### Chatbot not showing updated data?
→ Check if admin saved changes
→ Refresh chatbot page
→ Check `data/hotel-settings.json` file

### Admin dashboard not saving?
→ Check browser console for errors
→ Verify API route is working: visit `/api/hotel-settings`
→ Check file permissions on `data/` folder

### Images not loading?
→ Check internet connection (images from Unsplash)
→ Verify `next.config.js` has correct domains

### Port 3000 already in use?
→ Next.js will auto-use port 3001
→ Or stop other process: `npx kill-port 3000`

---

## 📝 Important Concepts

### What is "Dynamic Route" [id]?
- `[id]` in folder name = variable
- `/hotel/sindbad-hammamet` → id = "sindbad-hammamet"
- `/hotel/paradise-hammamet` → id = "paradise-hammamet"
- One page handles all hotels!

### What is "API Route"?
- Backend code that runs on server
- Handles data reading/writing
- Keeps sensitive operations secure
- URL: `/api/hotel-settings`

### What is "State"?
- Data that changes over time
- Example: chat messages, form inputs
- Managed with `useState` hook
- When state changes, UI updates

### What is "Component"?
- Reusable piece of UI
- Like a LEGO block
- Example: Button, Card, Form
- Can be used multiple times

---

## 🎓 Learning Path

### Beginner
1. Understand HTML/CSS basics
2. Learn JavaScript fundamentals
3. Try React tutorial
4. Explore this project's `app/page.tsx`

### Intermediate
1. Learn TypeScript basics
2. Understand React hooks (useState, useEffect)
3. Study `app/hotel/[id]/page.tsx`
4. Modify chatbot responses

### Advanced
1. Learn Next.js App Router
2. Understand API routes
3. Study full data flow
4. Add new features

---

## 💡 Ideas for Improvement

### Easy
- [ ] Change colors and styling
- [ ] Add more hotels
- [ ] Update hotel descriptions
- [ ] Add more special event fields

### Medium
- [ ] Add image upload for hotels
- [ ] Add admin login system
- [ ] Add email notifications
- [ ] Add booking form

### Hard
- [ ] Integrate real AI (OpenAI)
- [ ] Add database (PostgreSQL)
- [ ] Add payment system
- [ ] Create mobile app

---

## 🔗 Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Install dependencies
npm install

# Add new package
npm install package-name
```

---

## 📞 Where to Get Help

1. **Next.js Docs**: https://nextjs.org/docs
2. **React Docs**: https://react.dev
3. **Tailwind Docs**: https://tailwindcss.com/docs
4. **Stack Overflow**: Search your error message
5. **ChatGPT/Claude**: Ask specific questions about code

---

**Remember**: Start small, experiment, and don't be afraid to break things (you can always undo)!
