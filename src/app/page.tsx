"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/utils/api";
import type { FeedSummary, PostItem } from "@/types";
import {
  getAuthErrorMessage,
  getSessionPreview,
  getSessionUser,
  authFetch,
} from "@/utils/auth";
import { getSessionRole, isStaffRole } from "@/utils/roles";
import {
  getFeedLabel,
  isPostItem,
  sortOptions,
  visibilityOptions,
} from "@/utils/posts";

export default function HomePage() {
  const sessionPreview = getSessionPreview();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [sort, setSort] = useState<"recent" | "oldest" | "title">("recent");
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FeedSummary>({
    totalElements: 0,
    totalPages: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    void getSessionRole().then((role) => setIsStaff(isStaffRole(role)));
  }, [refreshKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loadPosts = async () => {
        setLoading(true);
        setMessage("");

        try {
          const currentUser = await getSessionUser();
          const currentUserId = currentUser?.id || "";

          const params = new URLSearchParams();
          params.set("page", "0");
          params.set("size", "100");
          if (query.trim()) params.set("q", query.trim());
          if (tag.trim()) params.set("tag", tag.trim());

          const response = await authFetch(
            apiUrl(
              `/api/posts${params.toString() ? `?${params.toString()}` : ""}`,
            ),
          );
          const data = await response.json().catch(() => null);

          if (!response.ok) {
            setPosts([]);
            setSummary({ totalElements: 0, totalPages: 0 });
            setMessage(getAuthErrorMessage(data, "Failed to load posts"));
            return;
          }

          const nextPosts = Array.isArray(data?.content)
            ? data.content.filter(isPostItem)
            : [];
          const ownedPosts = currentUserId
            ? nextPosts.filter(
                (post: PostItem) =>
                  (post.author?.id || post.authorId || "").toLowerCase() === currentUserId,
              )
            : [];
          setPosts(ownedPosts);
          setSummary({
            totalElements: ownedPosts.length,
            totalPages: ownedPosts.length > 0 ? 1 : 0,
          });
        } catch (error) {
          setPosts([]);
          setSummary({ totalElements: 0, totalPages: 0 });
          setMessage(
            error instanceof Error ? error.message : "Failed to load posts",
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
    const filtered = posts.filter(
      (post) =>
        visibility === "all" || post.visibility.toLowerCase() === visibility,
    );
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
  }, [posts, sort, visibility]);

  return (
    <main className="shell home-shell">
      <section className="panel home-panel">
        <div className="home-settings-group">
          <p className="muted" style={{ margin: 0 }}>
            Logged in as{" "}
            {sessionPreview?.username || sessionPreview?.subject || "Member"}
          </p>
          <Link
            className="home-settings-link"
            href="/settings"
            aria-label="Open settings"
          >
            <Image src="/gear.svg" alt="Settings" width={20} height={20} />
          </Link>
        </div>
        <div className="panel-inner home-inner">
          <header className="home-header">
            <div>
              <span className="brand">
                <span className="brand-mark" />
                BetterBlog
              </span>
              <h1 className="page-title">My posts</h1>
              <p className="lede">
                Browse your own posts here, including private ones, and use the
                filters to narrow the list.
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
              <label htmlFor="visibility">Visibility</label>
              <div className="dropdown-shell">
                <button
                  type="button"
                  className="dropdown-trigger"
                  onClick={() => {
                    setVisibilityOpen((current) => !current);
                    setSortOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={visibilityOpen}
                >
                  <span>
                    {getFeedLabel(visibilityOptions, visibility, "All posts")}
                  </span>
                  <span className="dropdown-caret" aria-hidden="true">
                    ⌄
                  </span>
                </button>

                {visibilityOpen ? (
                  <div
                    className="dropdown-menu"
                    role="listbox"
                    aria-label="Visibility options"
                  >
                    {visibilityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`dropdown-option ${visibility === option.value ? "is-selected" : ""}`}
                        onClick={() => {
                          setVisibility(option.value as typeof visibility);
                          setVisibilityOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="field">
              <label htmlFor="sort">Sort</label>
              <div className="dropdown-shell">
                <button
                  type="button"
                  className="dropdown-trigger"
                  onClick={() => {
                    setSortOpen((current) => !current);
                    setVisibilityOpen(false);
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
            <Link className="button-secondary" href="/posts/new">
              New post
            </Link>
            <Link className="button-secondary" href="/activity">
              Activity
            </Link>
            {isStaff ? (
              <Link className="button-secondary" href="/admin">
                Staff
              </Link>
            ) : null}
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
              <p className="muted">No posts match your filters yet.</p>
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
