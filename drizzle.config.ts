import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  connectionString:
    'mysql://neqggr6puti6w2ka3o3u:pscale_pw_rB8wYod2mq8r7r5qfbPqbRp1BxTXsqVEwNbRWrvwOPN@aws.connect.psdb.cloud/chicken-tracker-t3?ssl={"rejectUnauthorized":true}',
  breakpoints: true,
} satisfies Config;
