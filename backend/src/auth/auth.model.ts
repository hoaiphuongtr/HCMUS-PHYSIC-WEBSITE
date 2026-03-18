import z from 'zod';

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

export const RegisterBodySchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(11).optional(),
});

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;

export const CreateAdminBodySchema = RegisterBodySchema.extend({
  position: z.string().optional(),
  bio: z.string().optional(),
  departmentId: z.string().optional(),
});

export type CreateAdminBodyType = z.infer<typeof CreateAdminBodySchema>;

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
