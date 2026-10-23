import { z, ZodError } from "zod";
import { AxiosError, AxiosRequestConfig } from "axios";

import axios from "../axios";
import { errorResSchema, validationErrorResSchema } from "../schemas";
import { config as globalConfig } from "@/config";

/** A Laravel 422. `errors` maps each field (dot notation) to its messages; see applyApiErrors(). */
export class ApiValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiValidationError";
  }
}

export type ConflictOption = "archive" | "merge" | "deactivate" | "end_date" | "cancel";

/**
 * A 409: the record is in use, or the action doesn't fit its state (e.g. a completed budget).
 * `options` lists what the user can do instead (App\Exceptions\RecordInUseException); often empty.
 */
export class ApiConflictError extends Error {
  constructor(
    message: string,
    public readonly options: ConflictOption[]
  ) {
    super(message);
    this.name = "ApiConflictError";
  }
}

type Request<T> = {
  config: AxiosRequestConfig;
  schema: z.ZodType<T>;
  doNotRetryOn401?: boolean;
};

const handleZodError = (
  error: ZodError,
  config: AxiosRequestConfig,
  responseData: unknown
): never => {
  if (globalConfig.app.isDevelopment) {
    const url = config.url || "unknown";
    const method = (config.method || "GET").toUpperCase();
    const issues = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");

    console.error("❌ Request Data Parse Error:");
    console.error(`  Endpoint: ${method} ${url}`);
    console.error(`  Issues: ${issues}`);
    console.error("  Response data:", responseData);

    throw new Error(`Request Data Parse Error [${method} ${url}]: ${issues}`);
  }

  throw new Error("Unable to process the response. Please contact support if this persists.");
};

const extractServerErrorMessage = (errorData: unknown, fallbackMessage: string): string => {
  const validationParsed = validationErrorResSchema.safeParse(errorData);

  if (validationParsed.success) {
    return validationParsed.data.message;
  }

  const errorParsed = errorResSchema.safeParse(errorData);

  if (errorParsed.success) {
    return errorParsed.data.message;
  }

  return fallbackMessage;
};

const handleAxiosError = (error: AxiosError, doNotRetryOn401: boolean): never => {
  if (doNotRetryOn401 && error.response?.status === 401) {
    throw new Error("ERROR_UNAUTHENTICATED");
  }

  if (error.response?.data) {
    const validationParsed = validationErrorResSchema.safeParse(error.response.data);

    if (validationParsed.success) {
      throw new ApiValidationError(validationParsed.data.message, validationParsed.data.errors);
    }

    if (error.response.status === 409) {
      const data = error.response.data as { message?: string; options?: ConflictOption[] };
      throw new ApiConflictError(
        data.message ?? "This can't be done right now.",
        data.options ?? []
      );
    }

    const errorMessage = extractServerErrorMessage(error.response.data, error.message);
    throw new Error(errorMessage);
  }

  throw new Error("Cannot reach the server. Please check your connection.");
};

export const request = async <T>({
  config,
  schema,
  doNotRetryOn401 = false,
}: Request<T>): Promise<T> => {
  let response;
  try {
    response = await axios.request<unknown>(config);
    const validatedData = schema.parse(response.data);

    return validatedData;
  } catch (error) {
    if (error instanceof ZodError) {
      handleZodError(error, config, response?.data);
    }

    if (error instanceof AxiosError) {
      handleAxiosError(error, doNotRetryOn401);
    }

    throw new Error("Something went wrong. Please try again or contact support.");
  }
};
