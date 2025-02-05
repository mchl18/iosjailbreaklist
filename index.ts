import { file } from "bun";
import { CronJob } from "cron";
const GITHUB_API_URL =
  Bun.env.GITHUB_API_URL || "https://api.github.com/search/repositories";
const QUERY = Bun.env.QUERY || "rootless+jailbreak";
const ACCESS_TOKEN = Bun.env.GITHUB_ACCESS_TOKEN;

interface Repository {
  name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  updated_at: string;
}

interface CacheData {
  lastUpdated: Date;
  repositories: Repository[];
}

// In-memory cache
let cache: CacheData = {
  lastUpdated: new Date(0), // Initialize with old date to force first fetch
  repositories: [],
};

async function searchGithub(): Promise<Repository[]> {
  if (!ACCESS_TOKEN) {
    throw new Error("GITHUB_ACCESS_TOKEN is not set");
  }

  const response = await fetch(
    `${GITHUB_API_URL}?q=${encodeURIComponent(QUERY)}&sort=updated&order=desc`,
    {
      headers: {
        Authorization: `token ${ACCESS_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch data: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return (data.items || []).map((repo: any) => ({
    name: repo.name,
    html_url: repo.html_url,
    description: repo.description || "No description",
    stargazers_count: repo.stargazers_count,
    updated_at: repo.updated_at,
  }));
}

async function updateCache() {
  try {
    console.log("Fetching fresh data from GitHub...");
    const repositories = await searchGithub();
    cache = {
      lastUpdated: new Date(),
      repositories,
    };
    console.log(
      `Cache updated with ${repositories.length} repositories at ${cache.lastUpdated}`
    );
  } catch (error) {
    console.error("Error updating cache:", error);
    throw error;
  }
}

// Initial fetch on startup
updateCache().catch(console.error);

// Schedule updates every 6 hours using cron
// Runs at minute 0 of every 6th hour (00:00, 06:00, 12:00, 18:00)
new CronJob("0 */6 * * *", updateCache, null, true, "UTC");

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // API endpoint
    if (url.pathname === "/data") {
      return Response.json({
        success: true,
        count: cache.repositories.length,
        lastUpdated: cache.lastUpdated,
        repositories: cache.repositories,
      });
    }

    // Serve static files from dist directory
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const staticFile = file(`dist${path}`);
    if (await staticFile.exists()) {
      const content = await staticFile.text();
      const contentType = path.endsWith(".html")
        ? "text/html"
        : path.endsWith(".js")
        ? "text/javascript"
        : path.endsWith(".css")
        ? "text/css"
        : "text/plain";

      return new Response(content, {
        headers: { "Content-Type": contentType },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});
