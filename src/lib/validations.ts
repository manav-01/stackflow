import * as z from 'zod'

export const QuestionsSchema = z.object({
    title: z.string().min(5).max(130),
    explanation: z.string().min(100),
    tags: z.array(z.string().min(1).max(15)).min(1).max(3)
})

export const AnswerSchema = z.object({
    answer: z.string().min(100)
})

export const ProfileSchema = z.object({
    name: z.string().min(5, "Name must contain at least 5 characters").max(50),
    username: z.string().min(5, "Username must contain at least 5 characters").max(50),
    bio: z.string().min(10, "Bio must contain at least 10 characters").max(150).optional().or(z.literal("")),
    portfolioWebsite: z
        .string()
        .url("Portfolio Link must be a valid URL")
        .optional()
        .or(z.literal("")), // allow empty strings as valid
    location: z
        .string()
        .min(5, "Location must contain at least 5 characters")
        .max(50)
        .optional()
        .or(z.literal("")), // allow empty strings as valid
});