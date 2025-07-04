﻿# Alumni Connection Platform

A modern web application to connect alumni and students, enabling networking, messaging, event sharing, and professional growth. Built with Next.js, Clerk authentication, MongoDB Atlas, and deployed on Vercel.

---

## 🚀 Features

- **User Authentication:** Secure sign-up/sign-in with Clerk.
- **User Profiles:** Alumni and students with editable profiles.
- **Posts & Comments:** Share updates, comment, like/dislike posts.
- **Messaging:** Real-time chat between connected users.
- **Connections:** Send, accept, and manage connection requests.
- **Opportunities/Events:** Post and discover events or opportunities.
- **Responsive UI:** Modern, mobile-friendly design.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Authentication:** Clerk
- **Backend:** Next.js API Routes, Server Actions
- **Database:** MongoDB Atlas (via Mongoose)
- **Image Uploads:** Cloudinary
- **Deployment:** Vercel

---

## 📁 Folder Structure

```
app/            # Pages, layouts, API routes (frontend + backend)
components/     # Reusable React components
hooks/          # Custom React hooks
lib/            # DB connection, server actions, utilities
models/         # Mongoose schemas (database)
public/         # Static assets (images, icons)
```

---

## ⚡ Getting Started

### 1. **Clone the Repository**

```bash
git clone https://github.com/your-username/Alumni-Connection-Platform.git
cd Alumni-Connection-Platform
```

### 2. **Install Dependencies**

```bash
npm install
```

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

