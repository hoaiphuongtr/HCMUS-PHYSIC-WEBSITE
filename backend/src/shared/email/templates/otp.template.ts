import { layoutTemplate } from './layout.template';

export const otpTemplate = ({
  code,
  expiresIn,
}: {
  code: string;
  expiresIn: string;
}) =>
  layoutTemplate(`
    <p style="margin: 0 0 16px; color: #334155; font-size: 16px;">Your verification code is:</p>
    <div style="background: #f0f4f8; padding: 16px; border-radius: 8px; text-align: center; margin: 0 0 16px;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a365d;">${code}</span>
    </div>
    <p style="margin: 0; color: #64748b; font-size: 14px;">This code will expire in <strong>${expiresIn}</strong>. Do not share this code with anyone.</p>
  `);
