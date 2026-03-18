import { layoutTemplate } from './layout.template';

export const notificationTemplate = ({
  title,
  message,
  link,
}: {
  title: string;
  message: string;
  link?: string;
}) =>
  layoutTemplate(`
    <h2 style="margin: 0 0 12px; color: #1a365d; font-size: 18px;">${title}</h2>
    <p style="margin: 0 0 16px; color: #334155; font-size: 15px; line-height: 1.6;">${message}</p>
    ${
      link
        ? `<div style="text-align: center; margin-top: 24px;">
            <a href="${link}" style="display: inline-block; background-color: #1a365d; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: bold;">View Details</a>
          </div>`
        : ''
    }
  `);
