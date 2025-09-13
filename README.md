# Alumni Connection Platform

A modern, full-stack web application designed to foster connections between alumni and students. This platform enables professional networking, real-time messaging, event sharing, and career growth opportunities. Built with Next.js 14 (App Router), Clerk authentication, MongoDB Atlas, and Socket.IO for real-time communication.

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![Clerk](https://img.shields.io/badge/Clerk-000000?style=flat-square&logo=clerk&logoColor=white)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

---

## 🚀 Features

### Core Functionality
- **🔐 Authentication & Security**
  - Secure authentication with Clerk
  - Role-based access control
  - Session management

- **👥 User Profiles**
  - Comprehensive alumni/student profiles
  - Rich profile editing capabilities
  - Professional background and education history

- **💬 Real-time Communication**
  - One-on-one messaging
  - Group chats
  - Read receipts and typing indicators
  - Message history and search

- **🌐 Social Features**
  - News feed with posts and updates
  - Like, comment, and share functionality
  - Media sharing (images, documents)
  - Event creation and management

### Advanced Features
- **🔔 Notifications**
  - Real-time updates
  - Email digests
  - In-app notifications

- **📊 Opportunities**
  - Job postings
  - Internship opportunities
  - Networking events
  - Mentorship programs

- **📱 Progressive Web App**
  - Offline capabilities
  - Installable on devices
  - Push notifications

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Components:**
  - Radix UI (Accessible, unstyled components)
  - Tailwind CSS (Utility-first CSS framework)
  - Tailwind Merge (Class name utility)
  - Tailwind Animate (Animation utilities)
- **State Management:** React Context API
- **Form Handling:** React Hook Form
- **Date Handling:** date-fns
- **Icons:** Lucide React
- **Real-time:** Socket.IO Client
- **PWA:** Next-PWA

### Backend
- **Runtime:** Node.js
- **Framework:** Next.js API Routes
- **Database:**
  - MongoDB Atlas (Primary database)
  - Mongoose (ODM)
- **Authentication:**
  - Clerk (Authentication & User Management)
  - Next-Auth (Session management)
- **Real-time:**
  - Socket.IO Server
  - Event-driven architecture
- **Storage:**
  - Cloudinary (Media storage & optimization)
  - MongoDB GridFS (Optional file storage)

### DevOps & Infrastructure
- **Version Control:** Git
- **CI/CD:** GitHub Actions
- **Hosting:**
  - Vercel (Frontend & API)
  - Railway (Optional alternative)
- **Database Hosting:** MongoDB Atlas
- **Monitoring:** Vercel Analytics
- **Environment Management:** dotenv

---

## 📁 Project Structure

```
.
├── app/                    # Next.js 13+ App Router
│   ├── api/                # API routes (deprecated in favor of Server Actions)
│   ├── messages/           # Messaging interface
│   │   ├── [userId]/       # Individual chat pages
│   │   └── group/          # Group chat functionality
│   ├── onboarding/         # User onboarding flow
│   ├── opportunities/      # Career and event opportunities
│   ├── profile/            # User profile management
│   │   └── [userId]/       # Public profile views
│   ├── sign-in/            # Authentication pages
│   ├── sign-up/            # Registration pages
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
│
├── components/             # Reusable React components
│   ├── shared/            # Common UI components
│   ├── ui/                # Radix UI based components
│   └── layout/            # Layout components
│
├── contexts/              # React context providers
│   └── SocketContext.tsx  # WebSocket context
│
├── hooks/                 # Custom React hooks
│   ├── use-toast.ts       # Toast notifications
│   └── useCurrentUserProfile.ts # User profile hook
│
├── lib/                   # Utility functions and configurations
│   ├── db.ts             # Database connection
│   ├── serveractions.ts  # Server actions
│   ├── socket.js         # Socket.IO server setup
│   └── utils.ts          # Helper functions
│
├── models/               # Database models (Mongoose schemas)
├── public/               # Static assets
└── docs/                 # Documentation
    ├── PWA-IMPLEMENTATION.md
    ├── REALTIME-MESSAGING.md
    ├── SOCKET-INTEGRATION.md
    └── DEPLOYMENT-READY-SUMMARY.md
```

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm (comes with Node.js) or yarn
- MongoDB Atlas account (or local MongoDB instance)
- Clerk account for authentication
- Cloudinary account for media storage
- Git (for version control)

### 1. **Clone the Repository**

```bash
git clone https://github.com/VJ-E/Alumni-Connection-Platform.git
cd Alumni-Connection-Platform
```

### 2. **Install Dependencies**

```bash
npm install
# or
yarn install
```

### 3. **Environment Setup**

Create a `.env.local` file in the root directory and add the following environment variables:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Socket.IO
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 4. **Run the Development Server**

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 5. **Start the Socket.IO Server**

In a new terminal, start the Socket.IO server:

```bash
node lib/socket.js
```

### 6. **Build for Production**

```bash
npm run build
# or
yarn build
```

Then, start the production server:

```bash
npm start
# or
yarn start
```

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


