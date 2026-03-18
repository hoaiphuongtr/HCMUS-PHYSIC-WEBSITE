import z from 'zod';
import { VerificationMethod } from '../shared/constants/auth.constants';

export const LoginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginBodyType = z.infer<typeof LoginBodySchema>;

export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type LoginResType = z.infer<typeof LoginResSchema>;

export const RefreshTokenBodySchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>;
export const RefreshTokenResSchema = LoginResSchema;
export type RefreshTokenResType = z.infer<typeof RefreshTokenResSchema>;

export const RegisterBodySchema = z
  .object({
    email: z.email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6).max(100),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phone: z.string().max(11).optional(),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password and confirm password must match',
        path: ['confirmPassword'],
      });
    }
  });

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;

export const CreateAdminBodySchema = RegisterBodySchema.extend({
  position: z.string().optional(),
  bio: z.string().optional(),
  departmentId: z.string().optional(),
});

export type CreateAdminBodyType = z.infer<typeof CreateAdminBodySchema>;

export const SendOTPBodySchema = z.object({
  email: z.email(),
  type: z.enum(VerificationMethod),
});

export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>;

export const ForgotPasswordBodySchema = z
  .object({
    email: z.email(),
    code: z.string().length(6),
    newPassword: z.string().min(6).max(100),
    confirmNewPassword: z.string().min(6).max(100),
  })
  .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'New password and confirm new password must match',
        path: ['confirmNewPassword'],
      });
    }
  });

export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>;

export const GetAuthorizationUrlResSchema = z.object({
  url: z.string(),
});

export type GetAuthorizationUrlResType = z.infer<
  typeof GetAuthorizationUrlResSchema
>;

export const GoogleAuthStateSchema = z.object({
  userAgent: z.string(),
  ip: z.string(),
});

export type GoogleAuthStateType = z.infer<typeof GoogleAuthStateSchema>;

export const MessageResSchema = z.object({
  message: z.string(),
});

export type MessageResType = z.infer<typeof MessageResSchema>;

export const UserResSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: z.string(),
  isActive: z.boolean(),
  phone: z.string().nullable(),
  position: z.string().nullable(),
  bio: z.string().nullable(),
  departmentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserResType = z.infer<typeof UserResSchema>;
