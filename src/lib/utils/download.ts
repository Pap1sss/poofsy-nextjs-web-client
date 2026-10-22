import axios from "@/lib/axios";

/** Downloads an API file response (e.g. an import template) and saves it with the server's filename. */
export async function downloadFile(url: string, fallbackName: string): Promise<void> {
  const response = await axios.get<Blob>(url, { responseType: "blob" });

  const disposition = String(response.headers["content-disposition"] ?? "");
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1]) : fallbackName;

  const href = URL.createObjectURL(response.data);
  const link = Object.assign(document.createElement("a"), { href, download: filename });
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
