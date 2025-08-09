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
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string().default('collaborations'),
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    featured: z.boolean().default(false),
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
  }),
});

export const collections = {
  'credentials': credentialsCollection,
  'collaborations': collaborationsCollection,
  'certifications': certificationsCollection,
};
