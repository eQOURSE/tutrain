import { z } from 'zod';
import { idSchema, timestampSchema } from '../shared/index.js';

const channelSchema = z.enum(['whatsapp', 'sms', 'email']);
const userSchema = z.strictObject({
  id: idSchema,
  role: z.string().min(1),
  email: z.email().optional(),
  phone: z.string().min(1).optional(),
});
const learnerSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  grade: z.string(),
  status: z.string(),
});

export const otpSendRequestSchema = z.strictObject({
  channel: channelSchema,
  destination: z.string().min(1),
  purpose: z.string().min(1),
});
export type OtpSendRequest = z.infer<typeof otpSendRequestSchema>;

export const otpSendResponseSchema = z.strictObject({
  challenge_id: idSchema,
  expires_at: timestampSchema,
  channel: channelSchema,
});
export type OtpSendResponse = z.infer<typeof otpSendResponseSchema>;

export const otpVerifyRequestSchema = z.strictObject({
  challenge_id: idSchema,
  code: z.string().regex(/^\d{6}$/u),
});
export type OtpVerifyRequest = z.infer<typeof otpVerifyRequestSchema>;

export const otpVerifyResponseSchema = z.strictObject({
  user: userSchema,
  session_id: idSchema,
});
export type OtpVerifyResponse = z.infer<typeof otpVerifyResponseSchema>;

export const refreshResponseSchema = z.strictObject({
  session_id: idSchema,
  access_token: idSchema,
  expires_at: timestampSchema,
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

export const logoutRequestSchema = z.strictObject({ all_devices: z.boolean().optional() });
export type LogoutRequest = z.infer<typeof logoutRequestSchema>;

export const meResponseSchema = z.strictObject({
  user: userSchema,
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  learners: z.array(learnerSchema),
});
export type MeResponse = z.infer<typeof meResponseSchema>;
