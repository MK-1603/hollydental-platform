import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("patient"), // "admin" | "patient"
  isActive: boolean("is_active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  profilePicUrl: text("profile_pic_url"),
  displayName: varchar("display_name", { length: 150 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 2. Patients Table
export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  dateOfBirth: varchar("date_of_birth", { length: 50 }),
  gender: varchar("gender", { length: 20 }),
  bloodGroup: varchar("blood_group", { length: 20 }),
  age: integer("age"),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 100 }),
  emergencyPhone: varchar("emergency_phone", { length: 50 }),
  medicalConditions: text("medical_conditions"), // list of conditions or JSON
  medications: text("medications"),
  allergies: text("allergies"),
  insuranceProvider: varchar("insurance_provider", { length: 100 }),
  notes: text("notes"),
  gdprConsent: boolean("gdpr_consent").notNull().default(false),
  consentDate: timestamp("consent_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 3. Services Table
export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(), // general | cosmetic | orthodontics | advanced
  description: text("description"),
  priceFrom: integer("price_from").notNull(),
  priceTo: integer("price_to").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
});

// 4. Appointments Table
export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => services.id),
  doctorId: uuid("doctor_id").references(() => users.id),
  appointmentDate: varchar("appointment_date", { length: 50 }).notNull(), // YYYY-MM-DD
  appointmentTime: varchar("appointment_time", { length: 50 }).notNull(), // HH:MM
  durationMinutes: integer("duration_minutes").notNull().default(30),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending | confirmed | arrived | in_progress | completed | cancelled | no_show
  type: varchar("type", { length: 50 }).notNull().default("online"), // online | walkin | emergency
  notes: text("notes"),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  stripePaymentId: varchar("stripe_payment_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 5. Treatments Table
export const treatments = pgTable("treatments", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  serviceId: uuid("service_id").references(() => services.id),
  doctorId: uuid("doctor_id").references(() => users.id),
  date: timestamp("date").notNull().defaultNow(),
  description: text("description").notNull(),
  clinicalNotes: text("clinical_notes"),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 6. Dental Charts Table
export const dentalCharts = pgTable("dental_charts", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  toothNumber: integer("tooth_number").notNull(), // 1 to 32
  status: varchar("status", { length: 50 }).notNull().default("healthy"), // healthy | filled | crowned | extracted | root_canal | implant | needs_treatment
  notes: text("notes"),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 7. Invoices Table
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  items: jsonb("items").notNull(), // JSON list of items: { description, quantity, price }
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // draft | pending | paid | overdue | cancelled
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  paidAt: timestamp("paid_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 8. Files Table
export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  size: integer("size"),
  cloudinaryPublicId: varchar("cloudinary_public_id", { length: 255 }).notNull(),
  cloudinaryUrl: text("cloudinary_url").notNull(),
  category: varchar("category", { length: 50 }).notNull().default("other"), // xray | document | photo | other
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 9. Prescriptions Table
export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id").references(() => users.id),
  drugName: varchar("drug_name", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }).notNull(),
  frequency: varchar("frequency", { length: 100 }).notNull(),
  duration: varchar("duration", { length: 100 }).notNull(),
  instructions: text("instructions"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 10. Messages Table
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  senderRole: varchar("sender_role", { length: 50 }).notNull(), // admin | patient
  senderId: uuid("sender_id").references(() => users.id),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  /** Soft-delete marker so we can hide messages without losing the audit trail. */
  deletedAt: timestamp("deleted_at"),
  deletedBy: uuid("deleted_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 11. Blog Posts Table
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  body: text("body").notNull(),
  excerpt: text("excerpt"),
  authorId: uuid("author_id").references(() => users.id),
  featuredImageUrl: text("featured_image_url"),
  categoryId: uuid("category_id").references(() => blogCategories.id, { onDelete: "set null" }),
  tags: jsonb("tags"), // Storing array of tag IDs or strings for simplicity
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  canonicalUrl: varchar("canonical_url", { length: 255 }),
  readingTime: integer("reading_time"),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft | review | scheduled | published | archived
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 12. Audit / Activity Log Table — tracks security-sensitive actions across
// admins and patients (logins, password changes, role flips, appointment
// status updates, file deletions, etc.).
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorRole: varchar("actor_role", { length: 50 }), // admin | patient | system
  action: varchar("action", { length: 100 }).notNull(), // e.g. "auth.login.success", "user.force_password_change"
  targetType: varchar("target_type", { length: 50 }), // user | patient | appointment | message | file | invoice
  targetId: uuid("target_id"),
  metadata: jsonb("metadata"),
  ip: varchar("ip", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 13. Push Subscriptions — Web Push subscriptions keyed by user.
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 14. Password Reset Requests — admin-mediated reset flow. The patient
// requests a reset; staff verify identity (phone/in-person) and read the
// generated code back to them. We store a SHA-256 hash of the code, never
// the raw value.
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  /** SHA-256 hash of the human-readable code (8 alphanumerics). */
  tokenHash: varchar("token_hash", { length: 128 }).notNull(),
  /**
   * Convenience copy of the human-readable code for staff to read aloud to
   * the patient. Cleared once the reset is used or the request is closed.
   * Only visible to admin users via the password-resets queue page.
   */
  displayCode: varchar("display_code", { length: 32 }),
  status: varchar("status", { length: 30 }).notNull().default("pending"), // pending | resolved | used
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 15. Newsletter Subscribers — captured from the public blog and footer.
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  source: varchar("source", { length: 100 }).default("public"),
  confirmedAt: timestamp("confirmed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  patient: one(patients, {
    fields: [users.id],
    references: [patients.userId],
  }),
  appointments: many(appointments),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
  treatments: many(treatments),
  dentalCharts: many(dentalCharts),
  invoices: many(invoices),
  files: many(files),
  prescriptions: many(prescriptions),
  messages: many(messages),
}));

// 16. Products Table — oral care retail items and dental procedures.
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  /**
   * `price` is the lower bound for ranged items (e.g. dental procedures
   * costing "€120 – €180") and the only price for fixed-price retail items.
   * `priceTo` is the upper bound when the item has a range; null otherwise.
   */
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  priceTo: decimal("price_to", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  stockCount: integer("stock_count").notNull().default(0),
  /**
   * Storefront grouping: "procedure" (chairside services billed at the
   * clinic) or "extra" (retail items the patient takes home). Defaults to
   * "extra" so existing rows keep behaving as products in the shop.
   */
  category: varchar("category", { length: 32 }).notNull().default("extra"),
  /** Soft sort key for the storefront — lower numbers appear first. */
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 18. Wellness Logs — patient daily habit tracking synced to server
export const wellnessLogs = pgTable("wellness_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(),
  morningBrush: boolean("morning_brush").notNull().default(false),
  nightBrush: boolean("night_brush").notNull().default(false),
  floss: boolean("floss").notNull().default(false),
  streak: integer("streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 17. Orders Table — patients buy products via cash-on-pickup or UPI.
//
// `status` lifecycle:
//   pending      — order placed, awaiting payment confirmation by clinic
//   paid         — admin marked the UPI payment received
//   ready        — order prepared for pickup
//   completed    — patient collected at clinic
//   cancelled    — patient or admin cancelled before completion
//
// `paymentMethod` is "cash" or "upi". For UPI, `upiReference` stores the
// 12-character bank reference the patient pasted from their UPI app so the
// clinic can reconcile the deposit.
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "set null" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: varchar("product_name", { length: 255 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  quantity: integer("quantity").notNull().default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull().default("cash"),
  upiReference: varchar("upi_reference", { length: 80 }),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 80 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  fulfilledAt: timestamp("fulfilled_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

});

// 25. Clinical Notes Table — per-patient clinical records created by doctors
export const clinicalNotes = pgTable("clinical_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id").references(() => users.id, { onDelete: "set null" }),
  recordType: varchar("record_type", { length: 100 }).notNull().default("general"), // general | soap | treatment | followup
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 26. Notifications Table — in-app notifications per user
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull().default("info"), // info | success | warning | error | appointment | message | payment
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 27. App Settings Table — key/value store for clinic-wide configuration
export const appSettings = pgTable("app_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 28. Staff Table — clinic staff profiles linked to user accounts
export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 50 }).notNull().default("staff"), // doctor | dentist | hygienist | receptionist | staff | admin
  department: varchar("department", { length: 100 }),
  bio: text("bio"),
  schedule: jsonb("schedule"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 29. Suppliers Table — product/supply vendors
export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  status: varchar("status", { length: 50 }).notNull().default("active"), // active | inactive
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 22. Folders Table
export const folders = pgTable("folders", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 50 }),
  icon: varchar("icon", { length: 50 }),
  visibility: varchar("visibility", { length: 50 }).notNull().default("private"),
  folderType: varchar("folder_type", { length: 50 }).notNull().default("other"),
  tags: jsonb("tags"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 23. Blog Categories Table
export const blogCategories = pgTable("blog_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  color: varchar("color", { length: 50 }),
  icon: varchar("icon", { length: 50 }),
  parentId: uuid("parent_id"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 24. Blog Tags Table
export const blogTags = pgTable("blog_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
