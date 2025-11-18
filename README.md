# Alumni Connection Platform

A modern web application to connect alumni and students, enabling networking, real-time messaging, event sharing, and professional growth. Built with Next.js, Clerk authentication, MongoDB Atlas, and Socket.IO for real-time communication.

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![Clerk](https://img.shields.io/badge/Clerk-000000?style=flat-square&logo=clerk&logoColor=white)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🚀 Features

- **🔐 User Authentication:** Secure sign-up/sign-in with Clerk
- **👥 User Profiles:** Comprehensive profiles for alumni and students with rich editing capabilities
- **💬 Real-time Messaging:** Instant messaging between connected users with read receipts
- **📱 Responsive Design:** Fully responsive UI that works on all devices
- **🔗 Connection Management:** Send, accept, and manage professional connections
- **📝 Posts & Interactions:** Share updates, comment, and engage with the community
- **📅 Events & Opportunities:** Discover and participate in alumni events and career opportunities
- **🖼️ Media Sharing:** Upload and share images in messages and posts using Cloudinary

---

## 🛠️ Tech Stack

- **Frontend:**
  - Next.js 14 (App Router)
  - React 18
  - TypeScript
  - Tailwind CSS
  - Radix UI Components
  - Socket.IO Client

- **Authentication & Authorization:**
  - Clerk Authentication
  - Next.js Middleware

- **Backend:**
  - Next.js API Routes
  - Server Actions
  - Socket.IO Server
  - MongoDB Atlas (via Mongoose)

- **Storage & Media:**
  - Cloudinary (Image/File Storage)
  - MongoDB GridFS (if applicable)

- **Real-time Features:**
  - Socket.IO for bidirectional communication
  - Event-based architecture

- **Deployment:**
  - Vercel (Frontend & API Routes)
  - MongoDB Atlas (Database)

---

## 📁 Project Structure

```
app/
├── api/               # API routes
├── messages/          # Messaging interface
├── onboarding/        # User onboarding flow
├── opportunities/     # Events and opportunities
├── people/            # User directory
├── profile/           # User profile management
├── sign-in/           # Authentication pages
└── sign-up/           # Registration pages

components/           # Reusable React components
├── shared/           # Common UI components
└── ui/               # Radix UI based components

contexts/            # React context providers
hooks/               # Custom React hooks
lib/                 # Utility functions and configurations
models/              # Mongoose schemas and models
public/              # Static assets
realtime-backend/    # Socket.IO server implementation
```

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- MongoDB Atlas account
- Clerk account for authentication
- Cloudinary account for media storage

### 1. **Clone the Repository**

```bash
git clone https://github.com/VJ-E/Alumni-Connection-Platform.git
cd Alumni-Connection-Platform
```

### 2. **Install Dependencies**

```bash
# Install main dependencies
npm install

# Install realtime backend dependencies
cd realtime-backend
npm install
cd ..
```

### 3. **Environment Setup**

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Socket.IO
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001
```

### 4. **Start Development Servers**

In separate terminal windows, run:

```bash
# Start Next.js development server
npm run dev

# Start Socket.IO server
cd realtime-backend
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 🚀 Deployment

### Vercel Deployment

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Import the repository on Vercel
3. Add the same environment variables as in your `.env.local`
4. Deploy!

### MongoDB Atlas Setup

1. Create a new cluster on MongoDB Atlas
2. Set up a database user with read/write permissions
3. Add your IP to the IP whitelist
4. Get the connection string and update your environment variables

### Realtime Server

For production, you'll need to deploy the Socket.IO server separately (e.g., on Heroku, Railway, or render) and update the `NEXT_PUBLIC_SOCKET_SERVER_URL` environment variable accordingly.

---

## 🛡️ Security

- All API routes are protected with Clerk authentication
- Sensitive routes use server-side authentication checks
- Environment variables are used for sensitive configuration
- Input validation is implemented on both client and server
- Rate limiting is in place for authentication endpoints

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Clerk](https://clerk.com/) for authentication
- [MongoDB Atlas](https://www.mongodb.com/atlas/database) for the database
- [Socket.IO](https://socket.io/) for real-time communication
- [Tailwind CSS](https://tailwindcss.com/) for styling

### 3. **Set Up Environment Variables**

Create a `.env.local` file in the root directory and add the following:

```env
# MongoDB
MONGO_URI=your_mongodb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note:** You can find these values in your MongoDB Atlas, Clerk, and Cloudinary dashboards.

### 4. **Run the Development Server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🏗️ Deployment

This project is ready for deployment on [Vercel](https://vercel.com/):

1. Push your code to GitHub.
2. Import the repo into Vercel.
3. Set the same environment variables in the Vercel dashboard.
4. Deploy!

