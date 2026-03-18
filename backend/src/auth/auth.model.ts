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
