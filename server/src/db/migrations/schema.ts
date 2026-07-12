import { pgTable, uniqueIndex, foreignKey, pgEnum, text, jsonb, boolean, timestamp, integer, doublePrecision, uuid, varchar, index, unique, numeric } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const AppointmentStatus = pgEnum("AppointmentStatus", ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
export const InvoiceStatus = pgEnum("InvoiceStatus", ['UNPAID', 'PAID'])
export const Role = pgEnum("Role", ['ADMIN', 'DOCTOR', 'PATIENT'])


export const Doctor = pgTable("Doctor", {
	id: text("id").primaryKey().notNull(),
	userId: text("userId").notNull().references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	firstName: text("firstName").notNull(),
	lastName: text("lastName").notNull(),
	phone: text("phone").notNull(),
	specialization: text("specialization").notNull(),
	biography: text("biography").notNull(),
	avatarUrl: text("avatarUrl").default(''),
	availability: jsonb("availability").notNull(),
	active: boolean("active").default(true).notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).notNull(),
},
(table) => {
	return {
		userId_key: uniqueIndex("Doctor_userId_key").on(table.userId),
	}
});

export const Appointment = pgTable("Appointment", {
	id: text("id").primaryKey().notNull(),
	patientId: text("patientId").notNull().references(() => Patient.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	doctorId: text("doctorId").notNull().references(() => Doctor.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	serviceId: text("serviceId").notNull().references(() => Service.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	appointmentDate: timestamp("appointmentDate", { precision: 3, mode: 'string' }).notNull(),
	status: AppointmentStatus("status").default('PENDING').notNull(),
	notes: text("notes").default(''),
	prescription: text("prescription").default(''),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).notNull(),
});

export const Service = pgTable("Service", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	description: text("description").notNull(),
	durationMinutes: integer("durationMinutes").notNull(),
	price: doublePrecision("price").notNull(),
	active: boolean("active").default(true).notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).notNull(),
});

export const Invoice = pgTable("Invoice", {
	id: text("id").primaryKey().notNull(),
	appointmentId: text("appointmentId").notNull().references(() => Appointment.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	amount: doublePrecision("amount").notNull(),
	status: InvoiceStatus("status").default('UNPAID').notNull(),
	pdfUrl: text("pdfUrl"),
	paidAt: timestamp("paidAt", { precision: 3, mode: 'string' }),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const Testimonial = pgTable("Testimonial", {
	id: text("id").primaryKey().notNull(),
	patientId: text("patientId").notNull().references(() => Patient.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	rating: integer("rating").notNull(),
	comment: text("comment").notNull(),
	isApproved: boolean("isApproved").default(false).notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const Blog = pgTable("Blog", {
	id: text("id").primaryKey().notNull(),
	title: text("title").notNull(),
	content: text("content").notNull(),
	summary: text("summary").notNull(),
	imageUrl: text("imageUrl"),
	authorId: text("authorId").notNull().references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	isPublished: boolean("isPublished").default(false).notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).notNull(),
});

export const Notification = pgTable("Notification", {
	id: text("id").primaryKey().notNull(),
	userId: text("userId").notNull().references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	title: text("title").notNull(),
	message: text("message").notNull(),
	isRead: boolean("isRead").default(false).notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const FAQ = pgTable("FAQ", {
	id: text("id").primaryKey().notNull(),
	question: text("question").notNull(),
	answer: text("answer").notNull(),
	category: text("category").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const User = pgTable("User", {
	id: text("id").primaryKey().notNull(),
	email: text("email").notNull(),
	passwordHash: text("passwordHash").notNull(),
	role: Role("role").default('PATIENT').notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).notNull(),
},
(table) => {
	return {
		email_key: uniqueIndex("User_email_key").on(table.email),
	}
});

export const Patient = pgTable("Patient", {
	id: text("id").primaryKey().notNull(),
	userId: text("userId").notNull().references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	firstName: text("firstName").notNull(),
	lastName: text("lastName").notNull(),
	phone: text("phone").notNull(),
	dateOfBirth: text("dateOfBirth").notNull(),
	gender: text("gender").notNull(),
	address: text("address").default(''),
	medicalHistory: text("medicalHistory").default(''),
	reports: text("reports").default('RRAY[').array(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: 'string' }).notNull(),
},
(table) => {
	return {
		userId_key: uniqueIndex("Patient_userId_key").on(table.userId),
	}
});

export const ChatHistory = pgTable("ChatHistory", {
	id: text("id").primaryKey().notNull(),
	userId: text("userId").notNull().references(() => User.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	role: text("role").notNull(),
	message: text("message").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	patient_id: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" } ),
	sender_role: varchar("sender_role", { length: 50 }).notNull(),
	sender_id: uuid("sender_id").references(() => users.id),
	body: text("body").notNull(),
	is_read: boolean("is_read").default(false).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	read_at: timestamp("read_at", { mode: 'string' }),
	deleted_at: timestamp("deleted_at", { mode: 'string' }),
	deleted_by: uuid("deleted_by").references(() => users.id),
});

export const audit_logs = pgTable("audit_logs", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	actor_id: uuid("actor_id").references(() => users.id, { onDelete: "set null" } ),
	actor_role: varchar("actor_role", { length: 50 }),
	action: varchar("action", { length: 100 }).notNull(),
	target_type: varchar("target_type", { length: 50 }),
	target_id: uuid("target_id"),
	metadata: jsonb("metadata"),
	ip: varchar("ip", { length: 64 }),
	user_agent: text("user_agent"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		created_at_idx: index("audit_logs_created_at_idx").on(table.created_at),
		actor_id_idx: index("audit_logs_actor_id_idx").on(table.actor_id),
	}
});

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	password_hash: varchar("password_hash", { length: 255 }).notNull(),
	role: varchar("role", { length: 50 }).default('patient'::character varying).notNull(),
	is_active: boolean("is_active").default(true).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	must_change_password: boolean("must_change_password").default(false).notNull(),
	profile_pic_url: text("profile_pic_url"),
	display_name: varchar("display_name", { length: 150 }),
},
(table) => {
	return {
		users_email_unique: unique("users_email_unique").on(table.email),
	}
});

export const appointments = pgTable("appointments", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	patient_id: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" } ),
	service_id: uuid("service_id").references(() => services.id),
	doctor_id: uuid("doctor_id").references(() => users.id),
	appointment_date: varchar("appointment_date", { length: 50 }).notNull(),
	appointment_time: varchar("appointment_time", { length: 50 }).notNull(),
	duration_minutes: integer("duration_minutes").default(30).notNull(),
	status: varchar("status", { length: 50 }).default('pending'::character varying).notNull(),
	type: varchar("type", { length: 50 }).default('online'::character varying).notNull(),
	notes: text("notes"),
	deposit_paid: boolean("deposit_paid").default(false).notNull(),
	stripe_payment_id: varchar("stripe_payment_id", { length: 255 }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const services = pgTable("services", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }).notNull(),
	category: varchar("category", { length: 100 }).notNull(),
	description: text("description"),
	price_from: integer("price_from").notNull(),
	price_to: integer("price_to").notNull(),
	duration_minutes: integer("duration_minutes").default(30).notNull(),
	is_active: boolean("is_active").default(true).notNull(),
},
(table) => {
	return {
		services_slug_unique: unique("services_slug_unique").on(table.slug),
	}
});

export const blog_posts = pgTable("blog_posts", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	title: varchar("title", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }).notNull(),
	body: text("body").notNull(),
	excerpt: text("excerpt"),
	author_id: uuid("author_id").references(() => users.id),
	featured_image_url: text("featured_image_url"),
	category: varchar("category", { length: 100 }).notNull(),
	tags: text("tags"),
	seo_title: varchar("seo_title", { length: 255 }),
	seo_description: text("seo_description"),
	status: varchar("status", { length: 50 }).default('draft'::character varying).notNull(),
	published_at: timestamp("published_at", { mode: 'string' }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		blog_posts_slug_unique: unique("blog_posts_slug_unique").on(table.slug),
	}
});

export const patients = pgTable("patients", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	first_name: varchar("first_name", { length: 100 }).notNull(),
	last_name: varchar("last_name", { length: 100 }).notNull(),
	date_of_birth: varchar("date_of_birth", { length: 50 }),
	gender: varchar("gender", { length: 20 }),
	phone: varchar("phone", { length: 50 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	address: text("address"),
	emergency_contact: varchar("emergency_contact", { length: 100 }),
	emergency_phone: varchar("emergency_phone", { length: 50 }),
	medical_conditions: text("medical_conditions"),
	medications: text("medications"),
	allergies: text("allergies"),
	insurance_provider: varchar("insurance_provider", { length: 100 }),
	notes: text("notes"),
	gdpr_consent: boolean("gdpr_consent").default(false).notNull(),
	consent_date: timestamp("consent_date", { mode: 'string' }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	blood_group: varchar("blood_group", { length: 20 }),
	age: integer("age"),
},
(table) => {
	return {
		patients_email_unique: unique("patients_email_unique").on(table.email),
	}
});

export const dental_charts = pgTable("dental_charts", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	patient_id: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" } ),
	tooth_number: integer("tooth_number").notNull(),
	status: varchar("status", { length: 50 }).default('healthy'::character varying).notNull(),
	notes: text("notes"),
	updated_by: uuid("updated_by").references(() => users.id),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const files = pgTable("files", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	patient_id: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" } ),
	uploaded_by: uuid("uploaded_by").references(() => users.id),
	file_name: varchar("file_name", { length: 255 }).notNull(),
	file_type: varchar("file_type", { length: 100 }).notNull(),
	cloudinary_public_id: varchar("cloudinary_public_id", { length: 255 }).notNull(),
	cloudinary_url: text("cloudinary_url").notNull(),
	category: varchar("category", { length: 50 }).default('other'::character varying).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	patient_id: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" } ),
	invoice_number: varchar("invoice_number", { length: 100 }).notNull(),
	issue_date: timestamp("issue_date", { mode: 'string' }).defaultNow().notNull(),
	due_date: timestamp("due_date", { mode: 'string' }).notNull(),
	items: jsonb("items").notNull(),
	subtotal: numeric("subtotal", { precision: 10, scale:  2 }).notNull(),
	vat_amount: numeric("vat_amount", { precision: 10, scale:  2 }).notNull(),
	total_amount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	status: varchar("status", { length: 50 }).default('pending'::character varying).notNull(),
	stripe_payment_intent_id: varchar("stripe_payment_intent_id", { length: 255 }),
	paid_at: timestamp("paid_at", { mode: 'string' }),
	created_by: uuid("created_by").references(() => users.id),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		invoices_invoice_number_unique: unique("invoices_invoice_number_unique").on(table.invoice_number),
	}
});

export const prescriptions = pgTable("prescriptions", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	patient_id: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" } ),
	doctor_id: uuid("doctor_id").references(() => users.id),
	drug_name: varchar("drug_name", { length: 255 }).notNull(),
	dosage: varchar("dosage", { length: 100 }).notNull(),
	frequency: varchar("frequency", { length: 100 }).notNull(),
	duration: varchar("duration", { length: 100 }).notNull(),
	instructions: text("instructions"),
	notes: text("notes"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const treatments = pgTable("treatments", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	patient_id: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" } ),
	appointment_id: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" } ),
	service_id: uuid("service_id").references(() => services.id),
	doctor_id: uuid("doctor_id").references(() => users.id),
	date: timestamp("date", { mode: 'string' }).defaultNow().notNull(),
	description: text("description").notNull(),
	clinical_notes: text("clinical_notes"),
	cost: numeric("cost", { precision: 10, scale:  2 }).default('0.00').notNull(),
	follow_up_date: timestamp("follow_up_date", { mode: 'string' }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const push_subscriptions = pgTable("push_subscriptions", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	endpoint: text("endpoint").notNull(),
	p256dh: text("p256dh").notNull(),
	auth: text("auth").notNull(),
	user_agent: text("user_agent"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		push_subscriptions_endpoint_unique: unique("push_subscriptions_endpoint_unique").on(table.endpoint),
	}
});

export const password_reset_tokens = pgTable("password_reset_tokens", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	token_hash: varchar("token_hash", { length: 128 }).notNull(),
	display_code: varchar("display_code", { length: 32 }),
	status: varchar("status", { length: 30 }).default('pending'::character varying).notNull(),
	expires_at: timestamp("expires_at", { mode: 'string' }).notNull(),
	used_at: timestamp("used_at", { mode: 'string' }),
	resolved_at: timestamp("resolved_at", { mode: 'string' }),
	resolved_by: uuid("resolved_by").references(() => users.id),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		status_idx: index("password_reset_tokens_status_idx").on(table.status),
	}
});

export const newsletter_subscribers = pgTable("newsletter_subscribers", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	source: varchar("source", { length: 100 }).default('public'::character varying),
	confirmed_at: timestamp("confirmed_at", { mode: 'string' }),
	unsubscribed_at: timestamp("unsubscribed_at", { mode: 'string' }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		newsletter_subscribers_email_unique: unique("newsletter_subscribers_email_unique").on(table.email),
	}
});

export const orders = pgTable("orders", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" } ),
	patient_id: uuid("patient_id").references(() => patients.id, { onDelete: "set null" } ),
	product_id: uuid("product_id").references(() => products.id, { onDelete: "set null" } ),
	product_name: varchar("product_name", { length: 255 }).notNull(),
	unit_price: numeric("unit_price", { precision: 10, scale:  2 }).default('0.00').notNull(),
	quantity: integer("quantity").default(1).notNull(),
	total_amount: numeric("total_amount", { precision: 10, scale:  2 }).default('0.00').notNull(),
	payment_method: varchar("payment_method", { length: 20 }).default('cash'::character varying).notNull(),
	upi_reference: varchar("upi_reference", { length: 80 }),
	status: varchar("status", { length: 30 }).default('pending'::character varying).notNull(),
	customer_name: varchar("customer_name", { length: 255 }),
	customer_phone: varchar("customer_phone", { length: 80 }),
	customer_email: varchar("customer_email", { length: 255 }),
	notes: text("notes"),
	paid_at: timestamp("paid_at", { mode: 'string' }),
	fulfilled_at: timestamp("fulfilled_at", { mode: 'string' }),
	cancelled_at: timestamp("cancelled_at", { mode: 'string' }),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		status_idx: index("orders_status_idx").on(table.status),
		user_id_idx: index("orders_user_id_idx").on(table.user_id),
	}
});

export const notifications = pgTable("notifications", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	type: varchar("type", { length: 50 }).notNull(),
	title: varchar("title", { length: 255 }).notNull(),
	message: text("message").notNull(),
	metadata: jsonb("metadata"),
	is_read: boolean("is_read").default(false).notNull(),
	is_archived: boolean("is_archived").default(false).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const products = pgTable("products", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	price: numeric("price", { precision: 10, scale:  2 }).default('0.00').notNull(),
	image_url: text("image_url"),
	stock_count: integer("stock_count").default(0).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	price_to: numeric("price_to", { precision: 10, scale:  2 }),
	category: varchar("category", { length: 32 }).default('extra'::character varying).notNull(),
	display_order: integer("display_order").default(0).notNull(),
});

export const wellness_logs = pgTable("wellness_logs", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	patient_id: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" } ),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	date: varchar("date", { length: 10 }).notNull(),
	morning_brush: boolean("morning_brush").default(false).notNull(),
	night_brush: boolean("night_brush").default(false).notNull(),
	floss: boolean("floss").default(false).notNull(),
	streak: integer("streak").default(0).notNull(),
	longest_streak: integer("longest_streak").default(0).notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		wellness_logs_user_date_unique: unique("wellness_logs_user_date_unique").on(table.user_id, table.date),
	}
});

export const app_settings = pgTable("app_settings", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	key: varchar("key", { length: 255 }).notNull(),
	value: jsonb("value").notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		app_settings_key_unique: unique("app_settings_key_unique").on(table.key),
	}
});

export const clinical_notes = pgTable("clinical_notes", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	patient_id: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" } ),
	doctor_id: uuid("doctor_id").references(() => users.id, { onDelete: "set null" } ),
	record_type: varchar("record_type", { length: 50 }).notNull(),
	content: jsonb("content").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const staff = pgTable("staff", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" } ),
	first_name: varchar("first_name", { length: 100 }).notNull(),
	last_name: varchar("last_name", { length: 100 }).notNull(),
	role: varchar("role", { length: 50 }).default('staff'::character varying).notNull(),
	department: varchar("department", { length: 100 }),
	phone: varchar("phone", { length: 50 }),
	email: varchar("email", { length: 255 }).notNull(),
	bio: text("bio"),
	schedule: jsonb("schedule"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		staff_email_unique: unique("staff_email_unique").on(table.email),
	}
});