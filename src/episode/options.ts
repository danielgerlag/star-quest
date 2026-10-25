import { z } from 'zod';

const leadership = ['delegate', 'coordinate'] as const;
const rescue = ['close', 'wide'] as const;
const link = ['paced', 'continuous'] as const;

export const episodeOptionsSchema = z.object({
  leadership: z.enum(leadership).default('delegate'),
  rescue: z.enum(rescue).default('close'),
  link: z.enum(link).default('paced'),
});

export type EpisodeOptions = z.input<typeof episodeOptionsSchema>;
export type EpisodeHistory = z.output<typeof episodeOptionsSchema>;

export const episodeRoutes: readonly EpisodeHistory[] = leadership.flatMap((command) =>
  rescue.flatMap((approach) => link.map((connection) =>
    ({ leadership: command, rescue: approach, link: connection }))));
