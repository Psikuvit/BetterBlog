"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/utils/api";
import {
  authFetch,
  clearAuthSession,
  clearSessionUserCache,
} from "@/utils/auth";

const settingsSections = [
  {
    href: "/settings/sharing",
    title: "Sharing links",
    description: "Create and manage temporary share links for private posts.",
  },
  {
    href: "/settings/tokens",
    title: "API tokens",
    description: "Generate personal tokens for programmatic access.",
  },
  {
    href: "/activity",
    title: "Activity log",
    description: "Review recent account and security events.",
  },
];

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authFetch(apiUrl("/api/auth/logout"), {
        method: "POST",
      });
    } catch {
      // Clear local state even if the backend logout call fails.
    } finally {
      clearAuthSession();
      clearSessionUserCache();
      router.replace("/login");
    }
  };

  return (
    <main className="shell">
      <section className="panel" style={{ width: "min(100%, 960px)" }}>
        <div className="panel-inner">
          <div className="page-head">
            <div>
              <span className="brand">
                <span className="brand-mark" />
                BetterBlog
              </span>
              <h1 className="page-title">Settings</h1>
              <p className="lede">
                Manage sharing, API tokens, and account activity in one place.
              </p>
            </div>
            <div className="actions">
              <button
                className="button-secondary"
                type="button"
                onClick={handleLogout}
              >
                Log out
              </button>
              <Link className="button-secondary" href="/">
                Home
              </Link>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 18 }}>
            {settingsSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="card"
                style={{ textDecoration: "none" }}
              >
                <h2 style={{ marginTop: 0 }}>{section.title}</h2>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {section.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
