"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/utils/api";
import type { FeedSummary, PostItem } from "@/types";
import { getFeedLabel, isPostItem, sortOptions } from "@/utils/posts";

export default function PostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<"recent" | "oldest" | "title">("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FeedSummary>({
    totalElements: 0,
    totalPages: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loadPosts = async () => {
        setLoading(true);
        setMessage("");

        try {
          const params = new URLSearchParams();
          params.set("page", "0");
          params.set("size", "100");
          if (query.trim()) params.set("q", query.trim());
          if (tag.trim()) params.set("tag", tag.trim());

          const response = await fetch(
            apiUrl(
              `/api/posts${params.toString() ? `?${params.toString()}` : ""}`,
            ),
          );
          const data = await response.json().catch(() => null);

          if (!response.ok) {
            setPosts([]);
            setSummary({ totalElements: 0, totalPages: 0 });
            setMessage("Failed to load public posts");
            return;
          }

          const nextPosts = Array.isArray(data?.content)
            ? data.content.filter(isPostItem)
            : [];
          setPosts(nextPosts);
          setSummary({
            totalElements: nextPosts.length,
            totalPages: nextPosts.length > 0 ? 1 : 0,
          });
        } catch (error) {
          setPosts([]);
          setSummary({ totalElements: 0, totalPages: 0 });
          setMessage(
            error instanceof Error
              ? error.message
              : "Failed to load public posts",
          );
        } finally {
          setLoading(false);
        }
      };

      void loadPosts();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, refreshKey, tag]);

  const visiblePosts = useMemo(() => {
    const filtered = posts;
    const sorted = [...filtered];

    if (sort === "title") {
      sorted.sort((left, right) => left.title.localeCompare(right.title));
      return sorted;
    }

    sorted.sort((left, right) => {
      const leftTime = new Date(
        left.updatedAt || left.createdAt || 0,
      ).getTime();
      const rightTime = new Date(
        right.updatedAt || right.createdAt || 0,
      ).getTime();
      return sort === "recent" ? rightTime - leftTime : leftTime - rightTime;
    });

    return sorted;
  }, [posts, sort]);

  return (
    <main className="shell home-shell">
      <section className="panel home-panel">
        <div className="home-settings-group">
          <p className="muted" style={{ margin: 0 }}>
            Public feed
          </p>
        </div>
        <div className="panel-inner home-inner">
          <header className="home-header">
            <div>
              <span className="brand">
                <span className="brand-mark" />
                BetterBlog
              </span>
              <h1 className="page-title">Public posts</h1>
              <p className="lede">
                Browse public posts from all users, search by title or tag, and
                keep the layout evenly spaced.
              </p>
            </div>
          </header>

          <div className="home-toolbar">
            <div className="field">
              <label htmlFor="search">Search</label>
              <input
                id="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles, summaries, authors, content"
              />
            </div>

            <div className="field">
              <label htmlFor="tag">Tag</label>
              <input
                id="tag"
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                placeholder="tutorial"
              />
            </div>

            <div className="field">
              <label htmlFor="sort">Sort</label>
              <div className="dropdown-shell">
                <button
                  type="button"
                  className="dropdown-trigger"
                  onClick={() => {
                    setSortOpen((current) => !current);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                >
                  <span>{getFeedLabel(sortOptions, sort, "Most recent")}</span>
                  <span className="dropdown-caret" aria-hidden="true">
                    ⌄
                  </span>
                </button>

                {sortOpen ? (
                  <div
                    className="dropdown-menu"
                    role="listbox"
                    aria-label="Sort options"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`dropdown-option ${sort === option.value ? "is-selected" : ""}`}
                        onClick={() => {
                          setSort(option.value as typeof sort);
                          setSortOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="actions home-actions">
            <button
              className="button"
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
            >
              Refresh
            </button>
            <Link className="button-secondary" href="/">
              My posts
            </Link>
            <Link className="button-secondary" href="/posts/new">
              New post
            </Link>
          </div>

          <div className="home-summary">
            <span className="chip">{visiblePosts.length} visible</span>
            <span className="chip chip-muted">
              {summary.totalElements} total
            </span>
            <span className="chip chip-muted">
              {summary.totalPages} page(s)
            </span>
          </div>

          {message ? <div className="notice">{message}</div> : null}

          <div className="feed-list" aria-live="polite">
            {loading ? (
              <p className="muted">Loading posts...</p>
            ) : visiblePosts.length === 0 ? (
              <p className="muted">No public posts match your filters yet.</p>
            ) : (
              visiblePosts.map((post) => {
                const previewImage =
                  post.coverImageUrl || post.sourcePreviewImage || "";
                const previewTitle = post.sourcePreviewTitle || post.title;

                return (
                  <article className="feed-item" key={post.id}>
                    <div className="feed-visual">
                      {previewImage ? (
                        <Image
                          src={previewImage}
                          alt={previewTitle}
                          fill
                          sizes="(max-width: 920px) 100vw, 220px"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="feed-visual-fallback">
                          <span className="muted">{post.visibility}</span>
                        </div>
                      )}
                    </div>

                    <div className="feed-copy">
                      <div>
                        <h2 className="feed-title">{post.title}</h2>
                        <p className="feed-excerpt">
                          {post.excerpt || "No excerpt yet."}
                        </p>
                      </div>

                      <div className="feed-meta">
                        <span className="chip">{post.visibility}</span>
                        {post.authorUsername ? (
                          <span className="chip chip-muted">
                            @{post.authorUsername}
                          </span>
                        ) : null}
                        {post.publishedAt ? (
                          <span className="chip chip-muted">
                            Published{" "}
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </span>
                        ) : null}
                        {post.tags.slice(0, 4).map((item) => (
                          <span key={item} className="chip chip-muted">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="feed-actions">
                      <div
                        className="muted"
                        style={{ fontSize: "0.9rem", textAlign: "right" }}
                      >
                        <div>
                          {post.updatedAt
                            ? `Updated ${new Date(post.updatedAt).toLocaleDateString()}`
                            : "Recently updated"}
                        </div>
                        <div>{post.slug}</div>
                      </div>
                      <Link
                        className="button-secondary"
                        href={`/posts/${post.id}`}
                      >
                        Open post
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
