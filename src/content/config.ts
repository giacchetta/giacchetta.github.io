import { defineCollection, z } from 'astro:content';

const credentialsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string().default('credentials'),
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    featured: z.boolean().default(false),
  }),
});

const collaborationsCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string().default('collaborations'),
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    featured: z.boolean().default(false),
    role: z.string().optional(),
    period: z.string().optional(),
    location: z.string().optional(),
    summary: z.string().optional(),
    logo: image().optional(),
    order: z.number().optional(),
    type: z.enum(['company', 'article']).optional(),
  }),
});

const certificationsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string().default('certifications'),
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    featured: z.boolean().default(false),
    provider: z.string().optional(),
    certificationLevel: z.string().optional(),
    status: z.string().optional(),
    credentialUrl: z.string().optional(),
  }),
});

export const collections = {
  'credentials': credentialsCollection,
  'collaborations': collaborationsCollection,
  'certifications': certificationsCollection,
};
