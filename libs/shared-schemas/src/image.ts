import { z } from "zod";

export const ImageItemSchema = z.object({
  imageId: z.string(),
  owner: z.string(),
  title: z.string(),
  originalFileName: z.string(),
  dimensions: z.string().optional(),
  fileSize: z.number().optional(),
  uploadTime: z.string(),
  s3Key: z.string(),
  publicUrl: z.string(),
  status: z.string().optional(),
});

export type ImageItem = z.infer<typeof ImageItemSchema>;
