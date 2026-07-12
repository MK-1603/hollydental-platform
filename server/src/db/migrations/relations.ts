import { relations } from "drizzle-orm/relations";
import { User, Doctor, Patient, Appointment, Service, Invoice, Testimonial, Blog, Notification, ChatHistory, patients, messages, users, audit_logs, appointments, services, blog_posts, dental_charts, files, invoices, prescriptions, treatments, push_subscriptions, password_reset_tokens, orders, products, notifications, wellness_logs, clinical_notes, staff } from "./schema";

export const DoctorRelations = relations(Doctor, ({one, many}) => ({
	User: one(User, {
		fields: [Doctor.userId],
		references: [User.id]
	}),
	Appointments: many(Appointment),
}));

export const UserRelations = relations(User, ({many}) => ({
	Doctors: many(Doctor),
	Blogs: many(Blog),
	Notifications: many(Notification),
	Patients: many(Patient),
	ChatHistories: many(ChatHistory),
}));

export const AppointmentRelations = relations(Appointment, ({one, many}) => ({
	Patient: one(Patient, {
		fields: [Appointment.patientId],
		references: [Patient.id]
	}),
	Doctor: one(Doctor, {
		fields: [Appointment.doctorId],
		references: [Doctor.id]
	}),
	Service: one(Service, {
		fields: [Appointment.serviceId],
		references: [Service.id]
	}),
	Invoices: many(Invoice),
}));

export const PatientRelations = relations(Patient, ({one, many}) => ({
	Appointments: many(Appointment),
	Testimonials: many(Testimonial),
	User: one(User, {
		fields: [Patient.userId],
		references: [User.id]
	}),
}));

export const ServiceRelations = relations(Service, ({many}) => ({
	Appointments: many(Appointment),
}));

export const InvoiceRelations = relations(Invoice, ({one}) => ({
	Appointment: one(Appointment, {
		fields: [Invoice.appointmentId],
		references: [Appointment.id]
	}),
}));

export const TestimonialRelations = relations(Testimonial, ({one}) => ({
	Patient: one(Patient, {
		fields: [Testimonial.patientId],
		references: [Patient.id]
	}),
}));

export const BlogRelations = relations(Blog, ({one}) => ({
	User: one(User, {
		fields: [Blog.authorId],
		references: [User.id]
	}),
}));

export const NotificationRelations = relations(Notification, ({one}) => ({
	User: one(User, {
		fields: [Notification.userId],
		references: [User.id]
	}),
}));

export const ChatHistoryRelations = relations(ChatHistory, ({one}) => ({
	User: one(User, {
		fields: [ChatHistory.userId],
		references: [User.id]
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	patient: one(patients, {
		fields: [messages.patient_id],
		references: [patients.id]
	}),
	user_sender_id: one(users, {
		fields: [messages.sender_id],
		references: [users.id],
		relationName: "messages_sender_id_users_id"
	}),
	user_deleted_by: one(users, {
		fields: [messages.deleted_by],
		references: [users.id],
		relationName: "messages_deleted_by_users_id"
	}),
}));

export const patientsRelations = relations(patients, ({one, many}) => ({
	messages: many(messages),
	appointments: many(appointments),
	user: one(users, {
		fields: [patients.user_id],
		references: [users.id]
	}),
	dental_charts: many(dental_charts),
	files: many(files),
	invoices: many(invoices),
	prescriptions: many(prescriptions),
	treatments: many(treatments),
	orders: many(orders),
	wellness_logs: many(wellness_logs),
	clinical_notes: many(clinical_notes),
}));

export const usersRelations = relations(users, ({many}) => ({
	messages_sender_id: many(messages, {
		relationName: "messages_sender_id_users_id"
	}),
	messages_deleted_by: many(messages, {
		relationName: "messages_deleted_by_users_id"
	}),
	audit_logs: many(audit_logs),
	appointments: many(appointments),
	blog_posts: many(blog_posts),
	patients: many(patients),
	dental_charts: many(dental_charts),
	files: many(files),
	invoices: many(invoices),
	prescriptions: many(prescriptions),
	treatments: many(treatments),
	push_subscriptions: many(push_subscriptions),
	password_reset_tokens_user_id: many(password_reset_tokens, {
		relationName: "password_reset_tokens_user_id_users_id"
	}),
	password_reset_tokens_resolved_by: many(password_reset_tokens, {
		relationName: "password_reset_tokens_resolved_by_users_id"
	}),
	orders: many(orders),
	notifications: many(notifications),
	wellness_logs: many(wellness_logs),
	clinical_notes: many(clinical_notes),
	staff: many(staff),
}));

export const audit_logsRelations = relations(audit_logs, ({one}) => ({
	user: one(users, {
		fields: [audit_logs.actor_id],
		references: [users.id]
	}),
}));

export const appointmentsRelations = relations(appointments, ({one, many}) => ({
	patient: one(patients, {
		fields: [appointments.patient_id],
		references: [patients.id]
	}),
	service: one(services, {
		fields: [appointments.service_id],
		references: [services.id]
	}),
	user: one(users, {
		fields: [appointments.doctor_id],
		references: [users.id]
	}),
	treatments: many(treatments),
}));

export const servicesRelations = relations(services, ({many}) => ({
	appointments: many(appointments),
	treatments: many(treatments),
}));

export const blog_postsRelations = relations(blog_posts, ({one}) => ({
	user: one(users, {
		fields: [blog_posts.author_id],
		references: [users.id]
	}),
}));

export const dental_chartsRelations = relations(dental_charts, ({one}) => ({
	patient: one(patients, {
		fields: [dental_charts.patient_id],
		references: [patients.id]
	}),
	user: one(users, {
		fields: [dental_charts.updated_by],
		references: [users.id]
	}),
}));

export const filesRelations = relations(files, ({one}) => ({
	patient: one(patients, {
		fields: [files.patient_id],
		references: [patients.id]
	}),
	user: one(users, {
		fields: [files.uploaded_by],
		references: [users.id]
	}),
}));

export const invoicesRelations = relations(invoices, ({one}) => ({
	patient: one(patients, {
		fields: [invoices.patient_id],
		references: [patients.id]
	}),
	user: one(users, {
		fields: [invoices.created_by],
		references: [users.id]
	}),
}));

export const prescriptionsRelations = relations(prescriptions, ({one}) => ({
	patient: one(patients, {
		fields: [prescriptions.patient_id],
		references: [patients.id]
	}),
	user: one(users, {
		fields: [prescriptions.doctor_id],
		references: [users.id]
	}),
}));

export const treatmentsRelations = relations(treatments, ({one}) => ({
	patient: one(patients, {
		fields: [treatments.patient_id],
		references: [patients.id]
	}),
	appointment: one(appointments, {
		fields: [treatments.appointment_id],
		references: [appointments.id]
	}),
	service: one(services, {
		fields: [treatments.service_id],
		references: [services.id]
	}),
	user: one(users, {
		fields: [treatments.doctor_id],
		references: [users.id]
	}),
}));

export const push_subscriptionsRelations = relations(push_subscriptions, ({one}) => ({
	user: one(users, {
		fields: [push_subscriptions.user_id],
		references: [users.id]
	}),
}));

export const password_reset_tokensRelations = relations(password_reset_tokens, ({one}) => ({
	user_user_id: one(users, {
		fields: [password_reset_tokens.user_id],
		references: [users.id],
		relationName: "password_reset_tokens_user_id_users_id"
	}),
	user_resolved_by: one(users, {
		fields: [password_reset_tokens.resolved_by],
		references: [users.id],
		relationName: "password_reset_tokens_resolved_by_users_id"
	}),
}));

export const ordersRelations = relations(orders, ({one}) => ({
	user: one(users, {
		fields: [orders.user_id],
		references: [users.id]
	}),
	patient: one(patients, {
		fields: [orders.patient_id],
		references: [patients.id]
	}),
	product: one(products, {
		fields: [orders.product_id],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	orders: many(orders),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.user_id],
		references: [users.id]
	}),
}));

export const wellness_logsRelations = relations(wellness_logs, ({one}) => ({
	patient: one(patients, {
		fields: [wellness_logs.patient_id],
		references: [patients.id]
	}),
	user: one(users, {
		fields: [wellness_logs.user_id],
		references: [users.id]
	}),
}));

export const clinical_notesRelations = relations(clinical_notes, ({one}) => ({
	patient: one(patients, {
		fields: [clinical_notes.patient_id],
		references: [patients.id]
	}),
	user: one(users, {
		fields: [clinical_notes.doctor_id],
		references: [users.id]
	}),
}));

export const staffRelations = relations(staff, ({one}) => ({
	user: one(users, {
		fields: [staff.user_id],
		references: [users.id]
	}),
}));