# VaultKeep

VaultKeep is a secure family document vault application that allows users to create password-protected folders to organize and secure their important family documents.

## Features

- Secure user authentication with iron-session
- Password-protected document folders
- Premium purple-themed UI with 3D animations
- Built with Next.js 15 and Framer Motion
- MongoDB database for data storage

## Tech Stack

- **Framework**: Next.js 15.5.5 with App Router and Turbopack
- **Database**: MongoDB with Mongoose
- **Authentication**: iron-session with bcrypt
- **UI**: Tailwind CSS 4 with Framer Motion animations
- **TypeScript**: Full type safety

## Getting Started

First, set up your environment variables by creating a `.env.local` file:

```bash
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret_key
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
vaultkeep/
├── app/
│   ├── (auth)/          # Authentication pages (login, register)
│   ├── api/             # API routes
│   ├── dashboard/       # Dashboard pages
│   └── page.tsx         # Landing page
├── components/
│   ├── auth/            # Auth forms
│   └── ui/              # Reusable UI components
├── lib/                 # Utility functions and database
└── models/              # MongoDB models
```

## Security Features

- Password hashing with bcrypt
- Secure session management with iron-session
- Input validation with Zod
- Protected API routes
- Server-side authentication checks

## Development

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

Private project for family document management.
