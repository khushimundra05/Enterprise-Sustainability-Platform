"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";

export default function AIRecommendations() {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getComplianceRecommendations();
      setAdvice((data as any).advice ?? "");
    } catch (err: any) {
      console.error("AI fetch error", err);
      setError(err.message || "Failed to load AI insights");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Simple markdown-to-JSX renderer for the subset we generate
  function renderMarkdown(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <h2
            key={i}
            className="text-base font-semibold text-gray-900 mt-3 mb-1"
          >
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1">
            {line.slice(4)}
          </h3>
        );
      }
      if (line.startsWith("- ") || line.match(/^\d+\. /)) {
        const content = line.replace(/^\d+\. /, "").replace(/^- /, "");
        return (
          <div key={i} className="flex gap-2 text-sm text-gray-700 my-0.5">
            <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
            <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
          </div>
        );
      }
      if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
        return (
          <p key={i} className="text-sm font-semibold text-gray-800 my-1">
            {line.slice(2, -2)}
          </p>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-1" />;
      return (
        <p
          key={i}
          className="text-sm text-gray-700 my-0.5"
          dangerouslySetInnerHTML={{ __html: boldify(line) }}
        />
      );
    });
  }

  function boldify(text: string) {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  }

  return (
    <div className="border rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-lg">AI Sustainability Insights</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          disabled={loading}
          className="gap-1 text-xs text-gray-500"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-blue-200 rounded w-3/4" />
          <div className="h-3 bg-blue-200 rounded w-1/2" />
          <div className="h-3 bg-blue-200 rounded w-5/6" />
          <div className="h-3 bg-blue-200 rounded w-2/3" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-2 text-red-600">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm">{error}</p>
            <button onClick={load} className="text-xs underline mt-1">
              Try again
            </button>
          </div>
        </div>
      )}

      {!loading && !error && advice && (
        <div className="space-y-0.5">{renderMarkdown(advice)}</div>
      )}
    </div>
  );
}
