import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  email: z.string().email("ایمیل نامعتبر است"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

export const staffRegisterSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  email: z.string().email("ایمیل نامعتبر است"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  department: z.string().min(2, "بخش الزامی است"),
  phone: z.string().min(10, "شماره تماس نامعتبر است"),
});

export const staffCreateTicketSchema = z.object({
  subject: z.string().min(3, "موضوع باید حداقل ۳ کاراکتر باشد"),
  description: z.string().min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  category: z.enum([
    "IT",
    "MEDICAL_EQUIPMENT",
    "FACILITIES",
    "HR",
    "PHARMACY",
    "OTHER",
  ]),
});

export const loginSchema = z.object({
  email: z.string().email("ایمیل نامعتبر است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

export const createTicketSchema = z.object({
  subject: z.string().min(3, "موضوع باید حداقل ۳ کاراکتر باشد"),
  description: z.string().min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  category: z.enum([
    "IT",
    "MEDICAL_EQUIPMENT",
    "FACILITIES",
    "HR",
    "PHARMACY",
    "OTHER",
  ]),
  staffName: z.string().min(2, "نام الزامی است"),
  staffDepartment: z.string().min(2, "بخش الزامی است"),
  staffPhone: z.string().min(10, "شماره تماس نامعتبر است"),
  staffEmail: z.string().email("ایمیل نامعتبر است").optional().or(z.literal("")),
});

export const replySchema = z.object({
  message: z.string().min(1, "پیام نمی‌تواند خالی باشد"),
});

export const updateStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});
