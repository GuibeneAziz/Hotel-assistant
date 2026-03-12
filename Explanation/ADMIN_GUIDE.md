# 🏨 Hotel Admin Dashboard Guide

## 🚀 Quick Start

### **Access the Admin Dashboard**
1. Start your application: `npm run dev`
2. Open: **http://localhost:3000/admin**
3. Or click the "Admin" button on the main page

## 🎯 Features Overview

### **1. Restaurant Management**
- **Breakfast/Lunch/Dinner Schedules**: Set specific times for each meal
- **Availability Toggle**: Turn meals on/off (e.g., close breakfast on Sundays)
- **Real-time Updates**: Changes appear immediately in guest chat

**Example Use Cases:**
- Close lunch service for private events
- Extend dinner hours for special occasions
- Adjust breakfast times for different seasons

### **2. Spa Management**
- **Availability Control**: Open/close spa entirely
- **Operating Hours**: Set custom open/close times
- **Treatment List**: Display available spa services
- **Maintenance Mode**: Temporarily close for maintenance

### **3. Facilities Hours**
- **Pool**: Set opening hours, close for cleaning
- **Gym**: Adjust hours, close for maintenance
- **Kids Club**: Set age ranges and operating hours

### **4. Special Events**
- **Add Events**: Create special hotel events
- **Event Details**: Title, description, date, time, location
- **Guest Notifications**: Events appear in guest chat when asked
- **Easy Management**: Add/remove events with one click

## 📱 How It Works

### **Data Storage**
- **Primary**: JSON file (`data/hotel-settings.json`)
- **Backup**: Browser localStorage
- **Real-time**: Changes sync immediately

### **Guest Experience**
When guests ask questions, they get updated information:

**Guest asks**: "When does the restaurant open?"
**AI responds**: "🍽️ **Restaurant Schedule:**
- **Breakfast:** 07:00 - 10:00
- **Lunch:** 12:00 - 15:00  
- **Dinner:** 19:00 - 22:00"

## 🔧 Common Tasks

### **Close Spa for Maintenance**
1. Go to Admin Dashboard
2. Select your hotel
3. Find "Spa Management" section
4. Click the availability toggle to "Closed"
5. Click "Save Changes"

### **Add Special Event**
1. Go to "Special Events" section
2. Click "Add Event"
3. Fill in event details
4. Click "Add Event"
5. Save changes

### **Update Restaurant Hours**
1. Go to "Restaurant Schedule"
2. Adjust times for breakfast/lunch/dinner
3. Toggle availability if needed
4. Save changes

## 🎨 Customization

### **Add New Hotels**
Edit `app/admin/page.tsx` and add your hotel to the `defaultSettings` object:

```typescript
'your-hotel-id': {
  name: 'Your Hotel Name',
  restaurant: {
    breakfast: { start: '07:00', end: '10:00', available: true },
    // ... other settings
  }
}
```

### **Add New Facility Types**
You can extend the system to manage:
- Conference rooms
- Tennis courts
- Beach services
- Shuttle services

## 🔒 Security Notes

### **Current Setup (Development)**
- No authentication required
- Suitable for internal hotel staff
- Data stored locally

### **Production Recommendations**
- Add admin login system
- Use proper database (PostgreSQL/MongoDB)
- Add user roles (manager, staff, etc.)
- Implement audit logs

## 🚀 Deployment Options

### **Simple Deployment**
- Current setup works great for single hotel
- Deploy to Vercel/Netlify
- Data persists in JSON files

### **Advanced Deployment**
- Add database (recommended for multiple hotels)
- Add authentication system
- Add backup/restore functionality

## 📊 Benefits

### **For Hotel Managers**
- **Real-time Control**: Update information instantly
- **No Technical Skills**: Easy-to-use interface
- **Guest Satisfaction**: Always accurate information
- **Event Promotion**: Highlight special events

### **For Guests**
- **Accurate Information**: Always up-to-date schedules
- **Special Events**: Never miss hotel activities
- **Better Planning**: Know exact facility hours

## 🆘 Troubleshooting

### **Changes Not Appearing**
1. Make sure you clicked "Save Changes"
2. Refresh the guest interface
3. Check browser console for errors

### **Data Lost**
- Data is backed up in localStorage
- Check `data/hotel-settings.json` file
- Restore from backup if needed

### **Admin Page Not Loading**
1. Make sure development server is running
2. Check URL: `http://localhost:3000/admin`
3. Check browser console for errors

---

**The admin dashboard gives you complete control over your hotel's digital presence while keeping the interface simple and user-friendly!** 🎉