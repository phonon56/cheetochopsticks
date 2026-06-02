/**
 * Eleventy config for cheetochopsticks.com
 *
 * Strategy:
 *   - Output to `_site/`. Cloudflare Workers serves from there (see wrangler.jsonc).
 *   - We commit `_site/` to git so Cloudflare doesn't need a build step.
 *   - Run `npm run build` before committing site changes.
 *
 *   - Only `.njk` files are processed as templates. All other static assets
 *     (HTML microsites, SVGs, DOCX, JS, CSS) are passthrough-copied verbatim
 *     so existing pages keep working unchanged while we migrate them
 *     incrementally onto the shared layout.
 */
export default function (eleventyConfig) {
  // Passthrough copy every existing asset directory verbatim
  eleventyConfig.addPassthroughCopy("microsites");
  eleventyConfig.addPassthroughCopy("shared");
  eleventyConfig.addPassthroughCopy("worker");
  eleventyConfig.addPassthroughCopy("logo.svg");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy(".assetsignore");

  // Mirror .assetsignore exclusions so Eleventy doesn't pull a 224MB
  // node_modules from the cos-portal-prototype build into _site/.
  eleventyConfig.ignores.add("**/node_modules/**");
  eleventyConfig.ignores.add("microsites/city/goGov/cos-portal-prototype/src/**");
  eleventyConfig.ignores.add("microsites/city/goGov/cos-portal-prototype/scripts/**");
  eleventyConfig.ignores.add("microsites/city/goGov/cos-portal-prototype/public/**");

  return {
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_includes/layouts",
      data: "_data",
    },
  };
}
