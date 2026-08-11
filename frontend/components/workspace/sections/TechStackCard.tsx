"use client";

import type { TechStackItem } from "@/lib/types";

interface Props {
  data: TechStackItem[];
}

const categoryColors: Record<string, string> = {
  Framework: "var(--accent-light)",
  Styling: "#22d3ee",
  Animation: "#a78bfa",
  "3D": "#f472b6",
  Language: "#86efac",
  Tooling: "var(--text-muted)",
  Performance: "#fb923c",
};

function getCategoryColor(category: string): string {
  return categoryColors[category] ?? "var(--text-secondary)";
}

export function TechStackCard({ data }: Props) {
  // Group by category
  const grouped = data.reduce<Record<string, TechStackItem[]>>((acc, item) => {
    const key = item.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="card">
      <p className="section-label" style={{ marginBottom: "0.875rem" }}>
        Recommended Tech Stack
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: getCategoryColor(category),
                marginBottom: "0.375rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {category}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {items.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    background: "var(--bg-overlay)",
                    borderRadius: "7px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.name}
                      </span>
                      <span
                        style={{
                          fontSize: "0.625rem",
                          fontFamily: "var(--font-mono)",
                          color: item.verified ? "var(--status-green)" : "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                        title={item.verified_from ? `Verified via ${item.verified_from}` : ""}
                      >
                        {item.version}
                        {item.verified && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        )}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--text-muted)",
                        marginTop: "1px",
                      }}
                    >
                      {item.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
