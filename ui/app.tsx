import { useEffect, useState } from 'react';

interface Repository {
  name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  lastUpdated: string;
  repositories: Repository[];
}

export default function JailbreakList() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Jailbreak Repositories</h1>
      <p className="mb-4">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.repositories.map((repo) => (
          <div key={repo.html_url} className="border rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              <a 
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {repo.name}
              </a>
            </h2>
            <p className="text-gray-600 mb-2">{repo.description}</p>
            <div className="flex items-center text-sm text-gray-500">
              <span>⭐ {repo.stargazers_count}</span>
              <span className="mx-2">•</span>
              <span>Updated: {new Date(repo.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
