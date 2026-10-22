import { EchoOptions } from "laravel-echo";
import axios from "../axios";
import { config } from "@/config";

export const echoOptions: EchoOptions<"reverb"> = {
  broadcaster: "reverb",
  key: config.reverb.appKey,
  authorizer: (channel) => {
    return {
      authorize: (socketId, callback) => {
        axios
          .post("/broadcasting/auth", {
            socket_id: socketId,
            channel_name: channel.name,
          })
          .then((response) => {
            callback(null, response.data);
          })
          .catch((error) => {
            callback(error, null);
          });
      },
    };
  },
  // Dial Reverb on whatever host the browser used to reach the app, so the same
  // build works over LAN, ZeroTier, and localhost. Falls back to env during SSR.
  wsHost: typeof window !== "undefined" ? window.location.hostname : config.reverb.host,
  wsPort: config.reverb.port,
  wssPort: config.reverb.port,
  forceTLS: config.reverb.scheme === "https",
  enabledTransports: ["ws", "wss"],
  withCredentials: true,
};
