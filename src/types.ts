import { z } from 'zod';

export const AppOptions = z.object({
  appName: z.string(),
  port: z.number(),
  path: z.string().default('./').optional(),
  errorFile: z.string().optional(),
  logFile: z.string().optional(),
  commands: z.array(z.string()).optional(),
  env: z.object({}).catchall(z.string()).optional(),
  instances: z.number().optional(),
});

export const RepositoryOptions = z.object({
  /**
   * The name of the repository containing all the apps.
   * This is also the name of the local git repository.
   */
  repositoryName: z.string(),
  apps: z.array(AppOptions),
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
  repos: z.array(RepositoryOptions),
});

export type AppOptionsType = z.infer<typeof AppOptions>;
export type RepositoryType = z.infer<typeof RepositoryOptions>;
export type PushOptionsType = z.infer<typeof PushOptions>;
