import { z } from 'zod';

export const AppOptions = z.object({
  appName: z.string(),
  port: z.number(),
  errorFile: z.string().optional(),
  logFile: z.string().optional(),
  script: z.string().default('build/index.js').optional(),
  commands: z.array(z.string()).optional(),
  env: z.object({}).catchall(z.string()).optional(),
  instances: z.number().optional(),
  remote: z
    .string()
    .regex(/https:\/\/github.com\/(\w)*\/(\w)*/)
    .optional(),
});

export const PushOptions = z.object({
  /**
   * The root where all Cirrus related files will be stored.
   */
  root: z.string(),
  /**
   * Default environment variables that will be included for all
   * apps. These can be overwritten by providing `env` in `AppOptions`
   */
  env: z.object({}).catchall(z.string()),
  minUptime: z.number(),
  maxRestarts: z.number(),
  apps: z.object({}).catchall(z.array(AppOptions))
});

export type AppOptionsType = z.infer<typeof AppOptions>;
export type PushOptionsType = z.infer<typeof PushOptions>;
