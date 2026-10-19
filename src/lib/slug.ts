export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯʻ‘’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
