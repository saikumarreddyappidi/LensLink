# LensLink - Photography Booking Platform

A modern web application for booking professional photography services. Built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

### For Clients
- Browse and search photographers by specialty, location, and rating
- View photographer portfolios and reviews
- Book photography sessions
- Manage bookings and communicate with photographers
- User authentication and profile management

### For Photographers
- Create and manage professional profiles
- Upload portfolio images
- Set availability and pricing
- Manage bookings and client communications
- Receive and respond to booking requests

### System Features
- JWT-based authentication
- Role-based access control (Client, Photographer, Admin)
- Responsive design with Tailwind CSS
- Real-time availability checking
- Review and rating system
- Secure file uploads
- Rate limiting and security features

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - Rate limiting

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript (ES6+)** - Client-side logic
- **Flatpickr** - Date picker component

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd shutter
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lenslink
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:5000

# Email Configuration (optional - for future email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload Configuration
MAX_FILE_SIZE=5000000
FILE_UPLOAD_PATH=./uploads
```

### 4. Database Setup
Make sure MongoDB is running on your system. The application will automatically create the database and collections when it starts.

#### Option A: Local MongoDB
1. Install MongoDB on your system
2. Start MongoDB service
3. Use the connection string: `mongodb://localhost:27017/lenslink`

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Replace the MONGODB_URI in your .env file

### 5. Start the Application

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Photographers
- `GET /api/photographers` - Get all photographers
- `GET /api/photographers/:id` - Get single photographer
- `PUT /api/photographers/profile` - Update photographer profile
- `POST /api/photographers/portfolio` - Add portfolio item
- `DELETE /api/photographers/portfolio/:portfolioId` - Delete portfolio item
- `POST /api/photographers/:id/reviews` - Add review
- `GET /api/photographers/:id/availability` - Get availability

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get single booking
- `PUT /api/bookings/:id/status` - Update booking status
- `POST /api/bookings/:id/communication` - Add communication
- `PUT /api/bookings/:id` - Update booking details

## Usage

### Getting Started
1. Start the application using `npm run dev`
2. Open your browser and go to http://localhost:5000
3. Register as either a Client or Photographer
4. Explore the features based on your role

### For Clients
1. Register with role "Client"
2. Browse photographers on the "Find a Photographer" page
3. View photographer profiles and portfolios
4. Book sessions (feature coming soon)

### For Photographers
1. Register with role "Photographer"
2. Complete your profile with bio, specialties, and pricing
3. Upload portfolio images
4. Manage your availability and bookings

## Project Structure
```
shutter/
├── models/                 # Database models
│   ├── User.js            # User model
│   ├── Photographer.js    # Photographer model
│   └── Booking.js         # Booking model
├── routes/                # API routes
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User management routes
│   ├── photographers.js  # Photographer routes
│   └── bookings.js       # Booking routes
├── middleware/           # Custom middleware
│   └── auth.js          # Authentication middleware
├── uploads/             # File upload directory
├── index.html          # Frontend application
├── server.js           # Main server file
├── package.json        # Dependencies and scripts
├── .env               # Environment variables
└── README.md          # This file
```

## Security Features
- Password hashing with bcryptjs
- JWT token authentication
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers
- Role-based access control

## Development

### Adding New Features
1. Create/modify models in the `models/` directory
2. Add API routes in the `routes/` directory
3. Update frontend JavaScript in `index.html`
4. Test your changes thoroughly

### Environment Variables
- Always use environment variables for sensitive data
- Never commit `.env` files to version control
- Update `.env.example` when adding new variables

## Deployment

### Heroku Deployment
1. Create a Heroku account and install Heroku CLI
2. Create a new Heroku app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set MONGODB_URI=your-atlas-connection-string`
4. Deploy: `git push heroku main`

### Other Platforms
The application can be deployed to any platform that supports Node.js:
- Vercel
- Netlify (backend needs separate deployment)
- AWS
- DigitalOcean
- Railway

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
This project is open source and available under the MIT License.

## Support
For questions or issues, please create an issue in the repository or contact the development team.

## Future Enhancements
- Real-time chat system
- Payment integration (Stripe)
- Email notifications
- Advanced search filters
- Mobile app
- Photo delivery system
- Calendar integration
- Social media integration
