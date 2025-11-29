# FinSmart User Dashboard

User-facing dashboard for FinSmart Financial Literacy Platform.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript
- **UI Framework**: Shadcn UI (Tailwind CSS v4)
- **Backend/Database**: Firebase (Authentication & Firestore)
- **Form Handling**: React Hook Form + Zod
- **State Management**: React Context
- **Icons**: Lucide React

## Features

1. **Authentication (Google Login)**
   - Sign in with Google
   - Auto-create user document in Firestore
   - Protected routes with middleware and UserGuard

2. **Dashboard Home**
   - Welcome message with user name
   - Stats cards: Modules Completed, Average Score, Total Exams
   - Recent activity: Continue learning from last accessed modules
   - Quick actions: Browse Modules, View Events

3. **Module Management**
   - List all available modules
   - View module details with rich content (HTML from Tiptap)
   - Take exams for each module
   - View exam results with detailed feedback
   - Leaderboard: Top 5 learners per module

4. **Exam System**
   - Take exams with essay questions
   - Auto-scoring with text similarity (mock implementation)
   - Detailed results showing user answers vs key answers
   - Score display with color coding (Green >80%, Yellow 50-80%, Red <50%)

5. **Events & Programs**
   - Browse all events
   - Filter by category
   - Search by title
   - View event details with registration links

6. **User Profile**
   - Update display name and bio
   - View account information
   - View learning statistics

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Google Provider)
   - Create Firestore Database
   - Copy Firebase configuration to `.env.local` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Folder Structure

```
FinSmart/
├── app/
│   ├── (user)/              # User routes group
│   │   ├── layout.tsx       # User layout dengan navbar
│   │   ├── dashboard/       # Dashboard home
│   │   ├── modules/         # List & detail modules
│   │   │   └── [moduleId]/
│   │   │       ├── page.tsx # Detail module
│   │   │       └── exam/    # Exam page
│   │   ├── events/          # Events list
│   │   └── profile/         # User profile
│   ├── (auth)/
│   │   └── login/           # Login page
│   ├── layout.tsx           # Root layout dengan AuthProvider
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── user-navbar.tsx      # Navbar component
│   └── user-guard.tsx       # Protected route guard
├── lib/
│   ├── auth-context.tsx     # Auth context
│   ├── types.ts             # Type definitions
│   └── utils.ts             # Utility functions
└── firebase/
    └── config.ts            # Firebase configuration
```

## Firestore Collections

- `users`: User profiles (auto-created on first login)
- `modules`: Learning modules (created by admin)
- `exams`: Exam questions (created by admin, filtered by moduleId)
- `exam_results`: Exam submissions & scores
- `eventCategories`: Event categories (created by admin)
- `events`: Events/Programs (created by admin)

## Notes

- Make sure to configure appropriate Firestore Security Rules
- All user routes (except `/login`) require authentication
- Middleware will redirect to `/login` if user is not logged in
- The application uses light mode theme (dark mode is disabled)
- Exam scoring uses simple text similarity (mock implementation)
- Future: Integrate with AI scoring API for better accuracy

