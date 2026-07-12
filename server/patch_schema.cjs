const fs = require('fs');
let schema = fs.readFileSync('src/db/schema.js', 'utf8');

const additions = `
// 18. Suppliers Table
export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  website: varchar("website", { length: 255 }),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("active"), // active | inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 19. Notifications Table
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // e.g. "appointment", "message", "system"
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 20. App Settings Table
export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 21. Staff Table
export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  department: varchar("department", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }).notNull(),
  bio: text("bio"),
  schedule: jsonb("schedule"),
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
`;

schema += additions;

const oldFiles = `export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  cloudinaryPublicId: varchar("cloudinary_public_id", { length: 255 }).notNull(),
  cloudinaryUrl: text("cloudinary_url").notNull(),
  category: varchar("category", { length: 50 }).notNull().default("other"), // xray | document | photo | other
  createdAt: timestamp("created_at").notNull().defaultNow(),
});`;

const newFiles = `export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  size: integer("size"),
  cloudinaryPublicId: varchar("cloudinary_public_id", { length: 255 }).notNull(),
  cloudinaryUrl: text("cloudinary_url").notNull(),
  category: varchar("category", { length: 50 }).notNull().default("other"),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});`;

schema = schema.replace(oldFiles, newFiles);

const oldBlogPosts = `export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  body: text("body").notNull(),
  excerpt: text("excerpt"),
  authorId: uuid("author_id").references(() => users.id),
  featuredImageUrl: text("featured_image_url"),
  category: varchar("category", { length: 100 }).notNull(),
  tags: text("tags"), // Comma separated tags
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft | published
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});`;

const newBlogPosts = `export const blogPosts = pgTable("blog_posts", {
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
});`;

schema = schema.replace(oldBlogPosts, newBlogPosts);

fs.writeFileSync('src/db/schema.js', schema);
