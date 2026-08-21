export function withBasePath(path: string, basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "") {
  const normalizedBase = basePath.replace(/\/$/, "");
  return normalizedBase ? `${normalizedBase}${path}` : path;
}
