import type { ResearchEvidence } from "@/lib/types";
import { Link, Search, FileText, AlertCircle, CheckCircle, Database } from "lucide-react";

export function ResearchEvidenceCard({ data }: { data: ResearchEvidence | undefined }) {
  if (!data) return null;

  return (
    <div className="card group" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Search size={16} style={{ color: "var(--accent-light)" }} />
          <h2 className="section-label" style={{ fontSize: "0.9rem", color: "var(--text-primary)", margin: 0 }}>
            Sources / Research Evidence
          </h2>
        </div>
        <div style={{ 
          display: "flex", alignItems: "center", gap: "0.375rem", 
          padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 500,
          background: data.status === "completed" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          color: data.status === "completed" ? "var(--status-green)" : "var(--status-red)"
        }}>
          {data.status === "completed" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {data.status === "completed" ? "LIVE WEB RESEARCH" : "OFFLINE FALLBACK"}
        </div>
      </div>

      {data.error && (
        <div style={{ padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--status-red)" }}>
          <strong>Research Failed:</strong> {data.error}
        </div>
      )}

      {data.queries && data.queries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <h3 className="section-label" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>SEARCH QUERIES</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {data.queries.map((q, i) => (
              <span key={i} style={{ 
                fontSize: "0.75rem", padding: "0.25rem 0.5rem", background: "var(--bg-card-hover)", borderRadius: "4px", color: "var(--text-secondary)"
              }}>"{q}"</span>
            ))}
          </div>
        </div>
      )}

      {data.sources && data.sources.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
          <h3 className="section-label" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>SOURCES ANALYZED</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.75rem" }}>
            {data.sources.map((s, i) => (
              <a 
                key={i} href={s.url} target="_blank" rel="noreferrer"
                style={{
                  display: "flex", flexDirection: "column", gap: "0.375rem", padding: "0.75rem", 
                  border: "1px solid var(--border-subtle)", borderRadius: "6px", background: "var(--bg-body)",
                  textDecoration: "none", transition: "border-color 0.2s", opacity: s.status === "failed" ? 0.6 : 1
                }}
                className="hover:border-[var(--accent-light)]"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.3 }}>{s.title}</span>
                  <Link size={12} style={{ color: "var(--text-tertiary)", marginTop: "2px" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <FileText size={12} style={{ color: "var(--accent-light)" }} />
                    <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>{s.type}</span>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: s.status === "failed" ? "var(--status-red)" : "var(--status-green)" }}>
                    {s.status}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {data.technology_comparisons && data.technology_comparisons.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
          <h3 className="section-label" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>TECHNOLOGY COMPARISONS</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem" }}>
            {data.technology_comparisons.map((c, i) => (
              <div key={i} style={{ padding: "0.75rem", background: "var(--bg-card-hover)", borderRadius: "6px", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <Database size={14} style={{ color: "var(--accent-light)", marginTop: "2px", flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{c.technology}</span>
                    <span style={{ fontSize: "0.65rem", padding: "0.125rem 0.375rem", borderRadius: "10px", background: "var(--accent-subtle)", color: "var(--accent-light)", textTransform: "uppercase" }}>{c.recommendation}</span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{c.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
