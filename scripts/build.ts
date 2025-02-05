import plugin from "bun-plugin-tailwind";

await Bun.build({
  entrypoints: ["./ui/index.html"],
  outdir: "./dist",
  plugins: [plugin],
  minify: true,
});