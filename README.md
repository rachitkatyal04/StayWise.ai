# StayWise.ai - Smart Hotel Booking Platform 🏨

A full-stack hotel booking platform similar to Booking.com or OYO, built with modern web technologies and featuring AI-powered recommendations.

## 🚀 Features

### Core Functionality

- **Smart Hotel Search** - Find hotels by destination, dates, and guest count
- **AI-Powered Recommendations** - SmartStay Recommender engine for personalized suggestions
- **Real-time Availability** - Live booking availability and dynamic pricing
- **Secure Payments** - Integrated Razorpay payment gateway
- **Role-based Access** - Customer and Admin dashboards
- **Booking Management** - Complete booking lifecycle with confirmations
- **File Uploads** - Hotel image management with Multer
- **Email Notifications** - Booking confirmations and updates

### User Roles

1. **Customers** - Browse, search, and book hotels
2. **Admins** - Manage hotels, rooms, bookings, and view analytics

## 🛠️ Technology Stack

### Frontend

- **React.js** with JavaScript (JSX)
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management
- **Axios** for API communication

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **Multer** for file uploads
- **Razorpay** payment integration
- **Nodemailer** for emails
- **Rate limiting** and security middleware

### Database

- **MongoDB Atlas** - Cloud MongoDB instance
- **Pre-seeded** with 10+ hotels across major Indian cities

## 🚀 Quick Start (PowerShell)

For Windows PowerShell users, here's the quickest way to get started:

```powershell
# Start Backend Server
cd backend
node server.js
# Server will run on http://localhost:5000

# In a new PowerShell window, start Frontend
cd frontend
npm start
# Frontend will run on http://localhost:3000
```

## 📦 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (connection string provided)
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
node server.js
```

Server runs on: `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

Frontend runs on: `http://localhost:3000`

## 🗄️ Environment Configuration

The application now uses environment variables for secure configuration:

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=staywise_jwt_secret_key_2024_secure_token
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=StayWise.ai
REACT_APP_ENV=development
```

### Database Details

- **Database**: Pre-seeded with hotels in Mumbai, Delhi, Bangalore, Chennai, Jaipur, Goa, Kolkata, and Hyderabad
- **Admin User**:
  - Email: `admin@staywise.ai`
  - Password: `admin123`

## 🏗️ Project Structure

```
StayWise.ai/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Hotel.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── hotels.js
│   │   ├── bookings.js
│   │   ├── admin.js
│   │   └── payment.js
│   ├── middleware/
│   │   └── auth.js
│   ├── scripts/
│   │   └── seedHotels.js
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Common/
│   │   │   │   ├── Navigation.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── LoadingSpinner.jsx
│   │   │   ├── Hotel/
│   │   │   │   └── HotelCard.jsx
│   │   │   └── Search/
│   │   │       └── SearchBar.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   └── HomePage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Hotels

- `GET /api/hotels` - Search hotels with filters
- `GET /api/hotels/featured` - Get featured hotels
- `GET /api/hotels/:id` - Get hotel details
- `POST /api/hotels/:id/reviews` - Add hotel review

### Bookings

- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Admin

- `GET /api/admin/hotels` - Get all hotels (admin)
- `POST /api/admin/hotels` - Create new hotel
- `PUT /api/admin/hotels/:id` - Update hotel
- `DELETE /api/admin/hotels/:id` - Delete hotel
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/dashboard` - Get dashboard stats

### Payments

- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment

## 🎨 UI Components

### Completed Components

- **HomePage** - Landing page with hero section, search, featured hotels
- **Navigation** - Header with logo, menu, auth buttons
- **Footer** - Company info, links, popular destinations
- **SearchBar** - Hotel search with destination, dates, guests
- **HotelCard** - Hotel display card with images, rating, pricing
- **LoadingSpinner** - Loading indicator with different sizes

### Features Showcase

- **Hero Section** - Beautiful background with search functionality
- **SmartStay Recommender** - AI recommendation feature highlight
- **Featured Hotels** - Curated hotel selection display
- **Popular Destinations** - Quick city navigation
- **Features Section** - Platform benefits and features

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - API request limiting
- **Helmet.js** - Security headers
- **CORS Configuration** - Cross-origin resource sharing
- **Input Validation** - Request data validation
- **Password Hashing** - bcrypt password security

## 🚀 Deployment Ready(In-Process)

The application is structured for easy deployment on:

- **Frontend**: Vercel, Netlify, AWS S3
- **Backend**: Render, Heroku, AWS EC2
- **Database**: MongoDB Atlas (already configured)

## 📱 Responsive Design

- Mobile-first approach with Tailwind CSS
- Responsive grid layouts
- Touch-friendly interface
- Optimized for all screen sizes

## 🔧 Recent Fixes & Improvements

### ✅ Just Fixed

- **Environment Variables**: Moved MongoDB URL and sensitive data to .env files
- **PostCSS Configuration**: Fixed Tailwind CSS PostCSS plugin compatibility
- **ESLint Warnings**: Resolved anchor tag accessibility issues in Footer component
- **Dependency Management**: Properly configured Tailwind CSS and PostCSS
- **Security Enhancement**: Environment-based configuration for production readiness

## 🔄 Development Status

### ✅ Completed

- Complete backend API with all endpoints
- Database models and seeding
- Authentication system
- Payment integration setup
- Frontend structure with JSX/JavaScript
- Core components (HomePage, Navigation, Footer)
- Search and hotel card components
- Responsive design with Tailwind CSS
- Full conversion from TypeScript to JavaScript
- Fixed PostCSS and Tailwind CSS configuration
- Resolved ESLint anchor tag warnings
- Proper error handling and security configuration

### 🚧 Next Steps (Future Development)

- Hotel details page
- Search results page
- Booking flow pages
- User dashboard
- Admin dashboard
- Payment processing
- Email notifications
- Additional hotel management features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and queries:

- Email: admin@staywise.ai
- Platform: StayWise.ai Support Center

## 📄 License

This project is licensed under the MIT License.

---

**StayWise.ai** - Making hotel booking smarter with AI-powered recommendations! 🤖✨
