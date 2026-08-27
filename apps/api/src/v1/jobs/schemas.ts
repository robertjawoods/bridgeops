import z from "zod";

export const createJobRequestSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be at most 100 characters"),
	data: z.record(z.string(), z.unknown()).optional(),
});

export const createJobResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
});
