import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// user table with role-based access
//TODO: add MAJOR and gpa fields?
//TODO: add gpa for tutor-courses junction table?
export const user = sqliteTable('user', {
  id: text('id').primaryKey().notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false), // Required by Better Auth
  image: text('image'), // Required by Better Auth (maps to avatar)
  role: text('role').notNull().default('student'), // 'student' | 'tutor' | 'admin'
  universityId: text('university_id').references(() => universities.id),
  name: text('name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  location: text('location'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
// Universities table for Amsterdam/Netherlands
export const universities = sqliteTable('universities', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  city: text('city').notNull().default('Amsterdam'),
  country: text('country').notNull().default('Netherlands'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Courses table for different subjects
export const courses = sqliteTable('courses', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  department: text('department').notNull(),
  universityId: text('university_id').references(() => universities.id),
  description: text('description'),
  tags: text('tags', { mode: 'json' }), // string[] for course tags
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Tutors table with extended profile information
export const tutors = sqliteTable('tutors', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').references(() => user.id).notNull(),
  universityId: text('university_id').references(() => universities.id).notNull(),
  bio: text('bio').notNull().default(''),
  hourlyRate: real('hourly_rate'),
  location: text('location'),
  languages: text('languages', { mode: 'json' }).notNull().default('[]'), // string[] for languages
  courseTags: text('course_tags', { mode: 'json' }).notNull().default('[]'), // string[] for course expertise
  verified: integer('verified', { mode: 'boolean' }).default(false).notNull(),
  isAvailable: integer('is_available', { mode: 'boolean' }).default(true).notNull(),
  ratingAvg: real('rating_avg').default(0).notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  totalEarnings: real('total_earnings').default(0).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Junction table for tutor-course relationships
export const tutorCourses = sqliteTable('tutor_courses', {
  id: text('id').primaryKey().notNull(),
  tutorId: text('tutor_id').references(() => tutors.id).notNull(),
  courseId: text('course_id').references(() => courses.id).notNull(),
  experienceLevel: text('experience_level').notNull().default('beginner'), // 'beginner' | 'intermediate' | 'advanced'
  createdAt: text('created_at').notNull(),
});
// TODO: update courses table with actual course data from Amsterdam universities
// TODO: update university table to match with new courses table?(needed?)
// Availability slots for tutors
export const availabilitySlots = sqliteTable('availability_slots', {
  id: text('id').primaryKey().notNull(),
  tutorId: text('tutor_id').references(() => tutors.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6, Sunday=0
  startTime: text('start_time').notNull(), // HH:mm format
  endTime: text('end_time').notNull(), // HH:mm format
  timezone: text('timezone').notNull().default('Europe/Amsterdam'),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(true),
  specificDate: text('specific_date'), // YYYY-MM-DD for one-off slots
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Bookings table for tutoring sessions
export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey().notNull(),
  studentId: text('student_id').references(() => user.id).notNull(),
  tutorId: text('tutor_id').references(() => tutors.id).notNull(),
  courseId: text('course_id').references(() => courses.id).notNull(),
  sessionDate: text('session_date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(), // HH:mm
  endTime: text('end_time').notNull(), // HH:mm
  duration: integer('duration').notNull(), // minutes
  hourlyRate: real('hourly_rate').notNull(), // locked rate at booking time
  totalAmount: real('total_amount').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'refunded'
  paymentIntentId: text('payment_intent_id'), // Stripe payment reference
  sessionNotes: text('session_notes'),
  qrCode: text('qr_code'), // for check-in verification
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Booking events for status tracking
export const bookingEvents = sqliteTable('booking_events', {
  id: text('id').primaryKey().notNull(),
  bookingId: text('booking_id').references(() => bookings.id).notNull(),
  eventType: text('event_type').notNull(), // 'created' | 'confirmed' | 'started' | 'completed' | 'cancelled' | 'refunded'
  eventData: text('event_data', { mode: 'json' }), // additional event metadata
  triggeredBy: text('triggered_by').references(() => user.id).notNull(),
  createdAt: text('created_at').notNull(),
});

// Payouts for tutors
export const payouts = sqliteTable('payouts', {
  id: text('id').primaryKey().notNull(),
  tutorId: text('tutor_id').references(() => tutors.id).notNull(),
  bookingId: text('booking_id').references(() => bookings.id).notNull(),
  amount: real('amount').notNull(),
  platformFee: real('platform_fee').notNull(),
  netAmount: real('net_amount').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
  stripeTransferId: text('stripe_transfer_id'),
  processedAt: text('processed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Reviews and ratings
export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey().notNull(),
  bookingId: text('booking_id').references(() => bookings.id).notNull(),
  studentId: text('student_id').references(() => user.id).notNull(),
  tutorId: text('tutor_id').references(() => tutors.id).notNull(),
  rating: integer('rating').notNull(), // 1-5 stars
  comment: text('comment'),
  //TODO remove is public field, all reviews will be public
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Conversations table for tutor-student communication
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey().notNull(),
  user1Id: text('user1_id').notNull().references(() => user.id),
  user2Id: text('user2_id').notNull().references(() => user.id),
  lastMessageAt: text('last_message_at'),
  lastMessageContent: text('last_message_content'),
  unreadCount: integer('unread_count').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Messages for tutor-student communication
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().notNull(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id),
  senderId: text('sender_id').notNull().references(() => user.id),
  content: text('content').notNull(),
  messageType: text('message_type').notNull().default('text'),
  attachmentUrl: text('attachment_url'),
  bookingId: text('booking_id').references(() => bookings.id),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Files for tutor portfolios and documents
export const files = sqliteTable('files', {
  id: text('id').primaryKey().notNull(),
  uploaderId: text('uploader_id').references(() => user.id).notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(), // 'cv' | 'portfolio' | 'certificate' | 'message_attachment'
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(), // bytes
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

// Notifications for user
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').references(() => user.id).notNull(),
  type: text('type').notNull(), // 'booking_request' | 'booking_confirmed' | 'session_reminder' | 'payment_received' | 'review_received'
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: text('data', { mode: 'json' }), // additional notification data
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

// AI matches for intelligent tutor recommendations
export const aiMatches = sqliteTable('ai_matches', {
  id: text('id').primaryKey().notNull(),
  studentId: text('student_id').references(() => user.id).notNull(),
  tutorId: text('tutor_id').references(() => tutors.id).notNull(),
  courseId: text('course_id').references(() => courses.id).notNull(),
  universityId: text('university_id').references(() => universities.id).notNull(),
  matchScore: real('match_score').notNull(), // 0-100 compatibility score
  preferences: text('preferences', { mode: 'json' }), // student preferences used for matching
  reasoning: text('reasoning'), // AI explanation for the match
  isViewed: integer('is_viewed', { mode: 'boolean' }).default(false),
  isBookmarked: integer('is_bookmarked', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});
export * as schema from './schema';        // single schema object (e.g., for adapters)