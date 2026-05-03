import { defineCollection, z } from 'astro:content';

const scenarii = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    h1: z.string(),
    description: z.string(),
    keywords: z.array(z.string()).optional(),
    pain: z.string(),
    minVolume: z.number(),
    durationDays: z.string(),
    related: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    keywords: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  }),
});

const faq = defineCollection({
  type: 'data',
  schema: z.object({
    category: z.string(),
    order: z.number(),
    items: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    ),
  }),
});

export const collections = { scenarii, blog, faq };
