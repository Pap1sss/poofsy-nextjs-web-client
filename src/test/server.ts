import { setupServer } from "msw/node";

/** Shared MSW server; each test adds the handlers it needs with server.use(...). */
export const server = setupServer();
