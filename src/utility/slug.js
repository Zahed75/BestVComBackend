// utils/slug.js
exports.generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^_|_$/g, "")
    .replace(/^-|-$/g, ""); // Removes leading and trailing hyphens
};
