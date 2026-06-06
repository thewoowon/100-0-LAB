import { MetadataRoute } from "next";

const BASE_URL = "https://www.100to0lab.com";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface FeedVideo {
  id: number;
  created_at: string;
}
interface FeedResponse {
  videos: FeedVideo[];
  next_cursor: number | null;
  has_more: boolean;
}

async function fetchAllVideos(): Promise<FeedVideo[]> {
  const videos: FeedVideo[] = [];
  let cursor: number | null = null;
  let hasMore = true;

  while (hasMore) {
    const url = cursor
      ? `${API_URL}/videos/feed?cursor=${cursor}`
      : `${API_URL}/videos/feed`;
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const data: FeedResponse = await res.json();
      videos.push(...data.videos);
      cursor = data.next_cursor;
      hasMore = data.has_more;
      if (videos.length > 10000) break;
    } catch {
      break;
    }
  }

  return videos;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/map`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/upload`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/policy/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/policy/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const videos = await fetchAllVideos();
  const videoPages: MetadataRoute.Sitemap = videos.map((v) => ({
    url: `${BASE_URL}/video/${v.id}`,
    lastModified: new Date(v.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...videoPages];
}
