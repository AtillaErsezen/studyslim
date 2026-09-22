# StudySlim - Peer Tutoring Platform

A modern, full-stack peer tutoring platform built with Next.js, TypeScript, and Turso (LibSQL). StudySlim connects university students (currently focused on Amsterdam universities) with qualified peer tutors for academic support, powered by an AI matching and RAG-based assistant.

## 🌟 Features

### For Students
- **Smart Tutor Search**: Find tutors by course, university, price range, and availability
- **AI-Powered Matching**: Get personalized tutor recommendations based on your preferences
- **AI Chat Assistant**: Ask questions and get answers powered by a RAG pipeline built on university course materials
- **Session Booking**: Easy booking system with QR code check-in
- **Review System**: Rate and review tutors after sessions
- **Real-time Messaging**: Direct conversation threads with tutors

### For Tutors
- **Profile Management**: Create and customize your tutor profile
- **Availability Scheduling**: Set your available time slots
- **Course Expertise**: Tag your areas of expertise
- **Earnings Tracking**: Monitor your sessions and payouts
- **Verification System**: Get verified for increased credibility

### For Admins
- **User Management**: Manage students and tutors
- **Payout Processing**: Handle tutor payments via Stripe
- **Analytics Dashboard**: Track platform metrics
- **Content Moderation**: Review and approve tutor profiles

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.x** - React framework with App Router + Turbo dev mode
- **React 19** - UI library
- **TypeScript 5.x** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion / GSAP** - Animations
- **Lucide React / Heroicons / Tabler Icons** - Icon libraries
- **Shadcn/ui + Radix UI** - Component library
- **Recharts** - Data visualization
- **Embla Carousel / Swiper** - Carousel components
- **Three.js / React Three Fiber** - 3D visuals
- **tsParticles** - Particle effects

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Drizzle ORM 0.44.5** - Type-safe database toolkit
- **Turso (LibSQL)** - Distributed SQLite database
- **Better Auth 1.4.x** - Authentication system
- **Zod** - Schema validation
- **React Hook Form** - Form state management

### AI & RAG System
- **FAISS** - Vector similarity search index (`faiss_index.idx`)
- **Python RAG pipeline** (`RAG/vector.py`) - Ingests university PDF course materials (UVA, VU) and builds a searchable vector store
- **Next.js AI API route** (`/api/ai`) - Connects the frontend chat panel to the RAG backend

### Payment & Communication
- **Stripe** - Payment processing and tutor payouts
- **QR Code Generation** - Session check-in system
- **Sonner** - Toast notifications

## 📋 Prerequisites

- Node.js 20.x or higher
- npm, yarn, pnpm, or bun package manager
- Turso account (for database)
- Stripe account (for payments, optional)
- Python 3.x + pip (for RAG pipeline only)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AtillaErsezen/studyslim.git
cd studyslim
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
TURSO_CONNECTION_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Authentication
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

Generate and run database migrations:

```bash
# Generate migrations
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push

# (Optional) Open Drizzle Studio to view database
npx drizzle-kit studio
```

### 5. Seed Database (Optional)

Populate your database with sample data using the single seed file:

```bash
npx tsx src/db/seed.ts
```

### 6. Run Development Server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### RAG System Setup (Optional)

The AI chat feature relies on a Python-based RAG pipeline. To set it up:

```bash
cd RAG
pip install -r requirements.txt
python vector.py
```

This will process the university PDF materials (UVA, VU) and build the `faiss_index.idx` file used by the AI chat endpoint.

## 📁 Project Structure

```
studyslim/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── ai/            # AI chat (RAG) endpoint
│   │   │   ├── auth/          # Better Auth handler
│   │   │   ├── availability/  # Availability management
│   │   │   ├── bookings/      # Booking system
│   │   │   ├── conversations/ # Messaging conversations
│   │   │   ├── courses/       # Course catalog
│   │   │   ├── messages/      # Direct messages
│   │   │   ├── reviews/       # Review system
│   │   │   ├── tutor_courses/ # Tutor-course relationships
│   │   │   ├── tutors/        # Tutor management
│   │   │   ├── universities/  # University data
│   │   │   └── users/         # User management
│   │   ├── bookings/          # Booking detail pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── login/             # Login page
│   │   ├── profile/           # User profile page
│   │   ├── register/          # Registration page
│   │   ├── student/           # Student profile area
│   │   ├── tutor/             # Tutor profile & detail pages
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── AIChatPanel.tsx    # AI chat assistant UI
│   │   ├── BookingDetails.tsx # Booking detail view
│   │   ├── BookingsPanel.tsx  # Bookings list panel
│   │   ├── CreateBookingPanel.tsx # New booking flow
│   │   ├── CreateNewChat.tsx  # Start new conversation
│   │   ├── ErrorReporter.tsx  # Error handling UI
│   │   ├── TutorSearch.tsx    # Tutor search interface
│   │   ├── UserChat.tsx       # Messaging thread UI
│   │   ├── animate-ui/        # Animation components
│   │   ├── dashboard/         # Dashboard sub-components
│   │   ├── demo/              # Demo/showcase components
│   │   └── ui/                # Shadcn/ui components
│   ├── db/                    # Database layer
│   │   ├── schema.ts          # Database schema
│   │   ├── index.ts           # Database connection
│   │   └── seed.ts            # Database seeder
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utility libraries
│       ├── api.ts             # API client helpers
│       ├── auth.ts            # Server-side auth helpers
│       ├── auth-client.ts     # Client-side auth
│       └── utils.ts           # Utility functions
├── RAG/                       # Python RAG pipeline
│   ├── vector.py              # FAISS index builder
│   ├── requirements.txt       # Python dependencies
│   ├── UVA/                   # UVA course PDF materials
│   └── VU/                    # VU course PDF materials
├── scripts/                   # Data scraping utilities
│   ├── SCRAPER_README.md      # Scraper instructions
│   ├── scrape_fast.py         # Fast course scraper
│   ├── fetch_all_course_details.py
│   ├── vu_scrape.py
│   └── ...                    # Other scrapers
├── drizzle/                   # Generated migrations
├── public/                    # Static assets
├── faiss_index.idx            # Pre-built FAISS vector index
├── .env                       # Environment variables
├── drizzle.config.ts          # Drizzle ORM config
├── middleware.ts              # Next.js middleware (auth guards)
├── next.config.ts             # Next.js config
├── postcss.config.mjs         # PostCSS / Tailwind CSS 4 config
└── tsconfig.json              # TypeScript config
```

## 🗄️ Database Schema

### Core Tables
- **user** - User accounts and profiles (roles: student, tutor, admin)
- **tutors** - Tutor profiles, hourly rates, ratings, and earnings
- **universities** - University information (Amsterdam focus: UVA, VU, etc.)
- **courses** - Course catalog with department tags
- **tutor_courses** - Tutor-course relationships with experience levels

### Booking System
- **availability_slots** - Tutor recurring and one-off availability
- **bookings** - Session bookings with QR code and Stripe payment reference
- **booking_events** - Booking lifecycle event log

### Financial
- **payouts** - Tutor payment records with platform fee tracking

### Reviews & AI
- **reviews** - Session ratings and comments
- **ai_matches** - AI-generated tutor-student match scores and reasoning

### Communication
- **conversations** - Tutor-student conversation threads
- **messages** - Individual messages within conversations

### Files & Notifications
- **files** - Uploaded CVs, portfolios, and certificates
- **notifications** - In-app user notifications

### Authentication (Better Auth)
- **account** - OAuth provider connections
- **session** - User sessions
- **verification** - Email verification tokens

## 🔐 Authentication

StudySlim uses Better Auth for authentication with support for:
- Email/Password authentication
- OAuth providers (Google, GitHub, etc.)
- Email verification
- Session management
- Role-based access control (Student, Tutor, Admin)

Route protection is handled via `middleware.ts`.

## 📡 API Endpoints

### Tutors
- `GET /api/tutors` - Search and filter tutors
- `POST /api/tutors` - Create tutor profile
- `PUT /api/tutors?id={id}` - Update tutor profile
- `DELETE /api/tutors?id={id}` - Delete tutor profile

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings?id={id}` - Update booking
- `DELETE /api/bookings?id={id}` - Cancel booking

### Reviews
- `GET /api/reviews` - Get reviews
- `POST /api/reviews` - Submit review

### Conversations & Messages
- `GET /api/conversations` - List conversations for current user
- `POST /api/conversations` - Start a new conversation
- `GET /api/messages` - Get messages in a conversation
- `POST /api/messages` - Send a message

### AI Chat
- `POST /api/ai` - Query the RAG-powered AI assistant

### Availability
- `GET /api/availability` - Get tutor availability
- `POST /api/availability` - Create availability slot
- `PUT /api/availability?id={id}` - Update availability
- `DELETE /api/availability?id={id}` - Remove availability

### Tutor Courses
- `GET /api/tutor_courses` - List tutor-course relationships
- `POST /api/tutor_courses` - Add course to tutor profile

### Universities & Courses
- `GET /api/universities` - List universities
- `POST /api/universities` - Create university (admin)
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (admin)

### Users
- `GET /api/users` - Get user data

## 🔩 Scripts — Data Scraping

The `scripts/` directory contains Python scrapers used to collect university course data:

| Script | Purpose |
|---|---|
| `scrape_fast.py` | Fast parallel course scraper |
| `fetch_all_course_details.py` | Fetch full course detail pages |
| `details.py` | Parse course detail HTML |
| `merge_course_details.py` | Merge scraped JSON files |
| `vu_scrape.py` / `vu_click.py` / `vu_play.py` | VU Amsterdam course scrapers |
| `leiden_scrape.py` | Leiden University course scraper |
| `check_missing_vu_courses.py` | Audit missing VU course data |
| `download_missing_courses.py` | Re-download missing course pages |

See `scripts/SCRAPER_README.md` for detailed usage instructions.

## 🧪 Development Tools

### Drizzle Studio
Explore your database with a visual interface:
```bash
npx drizzle-kit studio
```

### TypeScript Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy to Vercel
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🔧 Configuration

### Database Configuration
Edit `drizzle.config.ts` to configure database connection:
```typescript
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "turso",
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
};
```

### Next.js Configuration
Customize `next.config.ts` for:
- Image optimization
- Redirects and rewrites
- Environment variables
- Build optimization

## 🐛 Known Issues

- **SQL Type Errors**: Some Drizzle ORM type inference issues with conditional queries (workaround: use type assertions)
- **Property Naming**: API returns snake_case (`university_id`) while TypeScript interfaces may use camelCase (`universityId`) — ensure consistency

## 🆘 Troubleshooting

### Database Connection Issues
- Verify `TURSO_CONNECTION_URL` and `TURSO_AUTH_TOKEN` in `.env`
- Check Turso dashboard for database status
- Run `npx drizzle-kit push` to sync schema

### Type Errors in Development
- Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- Clear `.next` folder: `Remove-Item -Recurse -Force .next` (Windows) or `rm -rf .next`
- Reinstall dependencies: `npm install`

### Hot Module Replacement Not Working
- Refresh the browser manually
- Check for syntax errors in your code
- Restart the dev server if necessary

### Seeder Errors
- Ensure environment variables are loaded before running `seed.ts`
- Check for foreign key constraint violations in the seed output

### RAG / AI Chat Not Working
- Ensure `faiss_index.idx` exists in the project root (run `python RAG/vector.py` to rebuild)
- Check that Python dependencies in `RAG/requirements.txt` are installed

## 📚 Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview) - Type-safe ORM for TypeScript
- [Turso Documentation](https://docs.turso.tech/) - Distributed SQLite platform
- [Better Auth Documentation](https://www.better-auth.com/docs) - Authentication for TypeScript
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Shadcn/ui Documentation](https://ui.shadcn.com/) - Re-usable components
- [FAISS Documentation](https://faiss.ai/) - Vector similarity search

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Drizzle ORM for type-safe database access
- Turso for distributed SQLite hosting
- Better Auth for authentication system
- Tailwind CSS for styling utilities
- Shadcn for beautiful UI components
- FAISS for efficient vector search

---

Built with ❤️ for students, by students.
