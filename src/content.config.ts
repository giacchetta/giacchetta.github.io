import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import credentialsData from './data/credentials.json';

/**
 * Every known skill id, built directly from the JSON import rather than
 * `src/utils/skills.js` — this file loads before `astro:content` types are
 * available, so it stays framework-free and local.
 */
const knownSkillIds = new Set(
  (Object.values(credentialsData) as any[]).flat().map((entry: any) => entry.id)
);

const credentialsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/credentials' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string().default('credentials'),
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const collaborationsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/collaborations' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string().default('collaborations'),
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    role: z.string().optional(),
    period: z.string().optional(),
    location: z.string().optional(),
    summary: z.string().optional(),
    logo: image().optional(),
    order: z.number().optional(),
    type: z.enum(['company', 'article']).optional(),
    company: z.string().optional(),
    // Array of src/data/credentials.json `id`s. Validated here rather than
    // left to a component check, so an unknown id fails the build with a
    // real, file-attributed Astro content error instead of silently
    // rendering nothing (see AGENTS.md's tech_stack note).
    tech_stack: z.array(z.string())
      .superRefine((ids, ctx) => {
        ids.forEach((id, i) => {
          if (!knownSkillIds.has(id)) {
            ctx.addIssue({
              code: 'custom',
              path: [i],
              message: `Unknown tech_stack id "${id}" — add it to src/data/credentials.json or fix the typo.`,
            });
          }
        });
      })
      .optional(),
  }),
});

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    description: z.string().optional(),
    date: z.coerce.date(),
    authors: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    pr: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

const certificationsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/certifications' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string().default('certifications'),
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    provider: z.string().optional(),
    certificationLevel: z.string().optional(),
    status: z.string().optional(),
    credentialUrl: z.string().optional(),
  }),
});

export const collections = {
  credentials: credentialsCollection,
  collaborations: collaborationsCollection,
  certifications: certificationsCollection,
  blog: blogCollection,
};
