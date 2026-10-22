export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "Poofsy",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Money comes, money goes… poof!",
    environment: process.env.NEXT_PUBLIC_APP_ENV || "development",
    isDevelopment: process.env.NEXT_PUBLIC_APP_ENV === "development",
    isProduction: process.env.NEXT_PUBLIC_APP_ENV === "production",
  },
  api: {
    url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  },
  reverb: {
    appKey: process.env.NEXT_PUBLIC_REVERB_APP_KEY || "",
    host: process.env.NEXT_PUBLIC_REVERB_HOST || "localhost",
    port: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || "8080", 10),
    scheme: process.env.NEXT_PUBLIC_REVERB_SCHEME || "http",
  },
} as const;
