import { z } from "zod";
import { poundsToPence } from "@/lib/format";
import { genders, orderChannels, orderStatuses, productStatuses, reviewSources } from "@/lib/types";

export const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;

const text = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`);
const optionalText = (max: number) => text(max).transform((v) => v || null);

const money = z
  .string()
  .trim()
  .refine((v) => poundsToPence(v) !== null, "Enter an amount like 199 or 199.99")
  .transform((v) => poundsToPence(v) as number);

const optionalMoney = z
  .string()
  .trim()
  .refine((v) => v === "" || poundsToPence(v) !== null, "Enter an amount like 199 or 199.99")
  .transform((v) => (v === "" ? null : (poundsToPence(v) as number)));

const optionalNumber = (max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= max), `Enter a number up to ${max}`)
    .transform((v) => (v === "" ? null : Number(v)));

const optionalHttpsUrl = z
  .union([z.literal(""), z.url({ protocol: /^https$/, error: "Use a full https:// link" })])
  .transform((v) => v || null);

export const productSchema = z.object({
  title: text(140).min(2, "Title is required"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(160)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single dashes"),
  description: text(10000),
  price: money,
  compareAt: optionalMoney,
  categorySlug: optionalText(60),
  gender: z.enum(genders),
  lengthIn: optionalNumber(60),
  weightLbs: optionalNumber(40),
  stockQty: z.coerce.number().int("Whole numbers only").min(0).max(999),
  status: z.enum(productStatuses),
  isFeatured: z.boolean(),
  badge: optionalText(40),
  sortOrder: z.coerce.number().int().min(-9999).max(9999),
  etsyListingId: z
    .string()
    .trim()
    .regex(/^\d*$/, "Digits only")
    .transform((v) => v || null),
});

export const orderUpdateSchema = z.object({
  status: z.enum(orderStatuses),
  carrier: optionalText(60),
  trackingNumber: optionalText(80),
  notes: optionalText(2000),
});

export const manualOrderSchema = z.object({
  channel: z.enum(orderChannels),
  status: z.enum(["pending", "paid"]),
  customerName: text(120).min(2, "Customer name is required"),
  customerEmail: z.union([z.literal(""), z.email("Enter a valid email")]).transform((v) => v || null),
  customerPhone: optionalText(40),
  line1: optionalText(120),
  line2: optionalText(120),
  city: optionalText(80),
  county: optionalText(80),
  postcode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || UK_POSTCODE.test(v), "Enter a valid UK postcode")
    .transform((v) => v || null),
  shipping: optionalMoney.transform((v) => v ?? 0),
  notes: optionalText(2000),
  items: z
    .array(z.object({ productId: z.uuid(), quantity: z.coerce.number().int().min(1).max(20) }))
    .min(1, "Add at least one baby"),
});

export const reviewSchema = z.object({
  authorName: text(80).min(1, "Name is required"),
  rating: z.coerce.number().int().min(1).max(5),
  body: text(2000).min(3, "Review text is required"),
  source: z.enum(reviewSources),
  reviewedAt: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use a valid date")
    .transform((v) => v || null),
  imageUrl: optionalHttpsUrl,
  isPublished: z.boolean(),
});

export const settingsSchema = z.object({
  announcement: text(160),
  tiktok: optionalHttpsUrl,
  instagram: optionalHttpsUrl,
  etsy: optionalHttpsUrl,
  vinted: optionalHttpsUrl,
  ebay: optionalHttpsUrl,
});
