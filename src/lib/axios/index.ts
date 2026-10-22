import Axios from "axios";
import { echo } from "@laravel/echo-react";

import { authQueryKey } from "@/features/auth/constant";
import { queryClient } from "@/lib/tanstack-query/client";

const axios = Axios.create({
  baseURL: "/api",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
  withCredentials: true,
  withXSRFToken: true,
});

axios.defaults.withXSRFToken = true;
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const currentEcho = echo();

  if (currentEcho.socketId()) {
    config.headers["X-Socket-Id"] = currentEcho.socketId();
  }

  return config;
});

// 401 = session gone, 419 = CSRF token expired. Refetching auth lets PrivateRoute
// send the user to the login page instead of leaving them on a broken screen.
axios.interceptors.response.use(undefined, (error) => {
  const status = error?.response?.status;
  const isAuthProbe = error?.config?.url?.includes("auth/spa/authenticate");

  if ((status === 401 || status === 419) && !isAuthProbe) {
    queryClient.invalidateQueries({ queryKey: [authQueryKey] });
  }

  return Promise.reject(error);
});

export default axios;
