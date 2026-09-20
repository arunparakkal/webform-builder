import type { FormDefinition, FormField } from "@webform/form-schema";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  api,
  type FormDetail,
  type HourlyAnalyticsResponse,
  type SubmissionItem,
} from "../api/client";
import { HourlyAnalyticsPanel } from "../components/HourlyAnalyticsPanel";
import { formatDate } from "../lib/fields";
import { hourlyChartWindow, resolveHourlyAnalyticsQuery } from "../lib/hourlyAnalytics";

const CHART_HOURS = 24;
const STATS_POLL_MS = 15_000;

/** Convert datetime-local value to ISO for the API (`z.string().datetime()`). */
function localToIso(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function cellValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Columns come from this form's fields (published first, else draft). */
function fieldsForTable(form: FormDetail | null): FormField[] {
  if (!form) return [];
  const published = form.publishedVersion?.definition as FormDefinition | undefined;
  const draft = form.draftDefinition;
  return (published?.fields ?? draft.fields ?? []).filter((f) => f.name);
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function revisionBadgeClass(revision: number) {
  const tone = revision % 3;
  if (tone === 1) return "bg-[#F3E8FF] text-[#7C3AED]";
  if (tone === 2) return "bg-[#DBEAFE] text-[#2563EB]";
  return "bg-[#D1FAE5] text-[#047857]";
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

const PAGE_SIZE = 10;

/** Compact page button list: 1 2 3 … 25 */
function buildPageList(current: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 0) return [];
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(pageCount - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < pageCount - 1) pages.push("ellipsis");
  pages.push(pageCount);
  return pages;
}

export function SubmissionsPage() {
  const { id = "" } = useParams();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [hourly, setHourly] = useState<HourlyAnalyticsResponse | null>(null);
  const [hourlyLoading, setHourlyLoading] = useState(true);
  const [hourlyError, setHourlyError] = useState<string | null>(null);
  const [revisionFilter, setRevisionFilter] = useState<string>("");
  const [fromLocal, setFromLocal] = useState("");
  const [toLocal, setToLocal] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"details" | "json">("details");

  const columns = useMemo(() => fieldsForTable(form), [form]);

  function filterParams() {
    return {
      revision: revisionFilter ? Number(revisionFilter) : undefined,
      from: localToIso(fromLocal),
      to: localToIso(toLocal),
    };
  }

  async function loadPage(pageNum: number) {
    const filters = filterParams();
    const response = await api.listSubmissions(id, {
      page: pageNum,
      limit: PAGE_SIZE,
      ...filters,
    });
    setItems(response.items);
    setTotal(response.total);
    setPage(response.page);
    setPageCount(response.pageCount);
    return response;
  }

  async function loadStats() {
    const filters = filterParams();
    const weekFrom = filters.from
      ? filters.from
      : startOfWeek().toISOString();
    const todayFrom = filters.from
      ? filters.from
      : startOfToday().toISOString();
    const [weekRes, todayRes] = await Promise.all([
      api.listSubmissions(id, { page: 1, limit: 1, ...filters, from: weekFrom }),
      api.listSubmissions(id, { page: 1, limit: 1, ...filters, from: todayFrom }),
    ]);
    setWeekCount(weekRes.total);
    setTodayCount(todayRes.total);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedId(null);
        setPage(1);
        const detail = await api.getForm(id);
        if (cancelled) return;
        setForm(detail);
        await Promise.all([loadPage(1), loadStats()]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load submissions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, revisionFilter, fromLocal, toLocal]);

  useEffect(() => {
    let cancelled = false;

    async function refresh(isPoll: boolean) {
      try {
        if (!isPoll) {
          setHourlyLoading(true);
          setHourly(null);
          setHourlyError(null);
        }
        const result = await api.hourlyAnalytics(
          id,
          resolveHourlyAnalyticsQuery({
            start: localToIso(fromLocal),
            end: localToIso(toLocal),
            hours: CHART_HOURS,
          }),
        );
        if (cancelled) return;
        setHourly(result);
        setHourlyError(null);
      } catch (err) {
        if (!cancelled) {
          setHourlyError(err instanceof Error ? err.message : "Failed to load hourly analytics");
        }
      } finally {
        if (!cancelled && !isPoll) setHourlyLoading(false);
      }
    }

    void refresh(false);
    const timer = setInterval(() => void refresh(true), STATS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id, fromLocal, toLocal]);

  async function goToPage(next: number) {
    if (next < 1 || (pageCount > 0 && next > pageCount) || next === page) return;
    try {
      setLoading(true);
      setError(null);
      setSelectedId(null);
      await loadPage(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load page");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      setError(null);
      const blob = await api.exportSubmissions(id, filterParams());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `submissions-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      if (formatDate(item.createdAt).toLowerCase().includes(q)) return true;
      if (`r${item.revision}`.includes(q)) return true;
      return Object.values(item.payload).some((v) => cellValue(v).toLowerCase().includes(q));
    });
  }, [items, search]);

  const selected = filtered.find((i) => i.id === selectedId) ?? null;
  const selectedIndex = selected ? filtered.findIndex((i) => i.id === selected.id) : -1;

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const pageButtons = buildPageList(page, pageCount);

  const revisions = form?.versions ?? [];
  const isPublished = form?.status === "published";
  const chartWindow = hourlyChartWindow(
    { start: localToIso(fromLocal), end: localToIso(toLocal) },
    CHART_HOURS,
  );

  const inputClass =
    "mt-1 block w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15";

  const pageBtn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-40";
  const pageBtnActive =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#2563EB] px-2 text-sm font-medium text-white";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      {/* Header — no left form sidebar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-[#64748B]">
            <Link to="/app" className="no-underline hover:text-[#2563EB]">
              My Forms
            </Link>
            <span>/</span>
            <Link to={`/forms/${id}`} className="no-underline hover:text-[#2563EB]">
              {form?.title ?? "Form"}
            </Link>
            <span>/</span>
            <span className="text-[#0F172A]">Submissions</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-[#0F172A]">
              {form?.title ?? "Submissions"}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isPublished ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#F1F5F9] text-[#64748B]"
              }`}
            >
              {isPublished ? "Published" : "Draft"}
            </span>
            {form?.slug ? (
              <span className="truncate text-xs text-[#94A3B8]">{form.slug}</span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to={`/forms/${id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] no-underline shadow-sm hover:bg-[#F8FAFC]"
            >
              ← Edit form
            </Link>
            {isPublished ? (
              <Link
                to={`/forms/${id}/published`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#2563EB] no-underline shadow-sm hover:bg-[#EFF6FF]"
              >
                Show embed code
              </Link>
            ) : (
              <span
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-sm font-medium text-[#94A3B8]"
                title="Publish the form first to get share and embed links"
              >
                Show embed code
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="min-w-[7rem] rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 shadow-sm">
            <p className="text-[11px] font-medium text-[#64748B]">Total submissions</p>
            <p className="text-lg font-semibold text-[#0F172A]">{total}</p>
          </div>
          <div className="min-w-[7rem] rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 shadow-sm">
            <p className="text-[11px] font-medium text-[#64748B]">This week</p>
            <p className="text-lg font-semibold text-[#0F172A]">{weekCount}</p>
          </div>
          <div className="min-w-[7rem] rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 shadow-sm">
            <p className="text-[11px] font-medium text-[#64748B]">Today</p>
            <p className="text-lg font-semibold text-[#0F172A]">{todayCount}</p>
          </div>
        </div>
      </div>

      <HourlyAnalyticsPanel
        data={hourly?.data ?? null}
        hours={chartWindow.hours}
        now={chartWindow.now}
        loading={hourlyLoading}
        error={hourlyError}
      />

      <div className="flex min-w-0 gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">Submissions</h2>
              <p className="text-sm text-[#64748B]">View and manage all form responses.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] shadow-sm hover:bg-[#F8FAFC] disabled:opacity-60"
              disabled={exporting}
              onClick={() => void handleExport()}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 14.5V16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <label className="block min-w-[9rem] text-xs font-medium text-[#64748B]">
              Revision
              <select
                className={inputClass}
                value={revisionFilter}
                onChange={(e) => setRevisionFilter(e.target.value)}
              >
                <option value="">All revisions</option>
                {revisions.map((v) => (
                  <option key={v.id} value={String(v.revision)}>
                    Revision {v.revision}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-[#64748B]">
              From
              <input
                type="datetime-local"
                className={inputClass}
                value={fromLocal}
                onChange={(e) => setFromLocal(e.target.value)}
              />
            </label>
            <label className="block text-xs font-medium text-[#64748B]">
              To
              <input
                type="datetime-local"
                className={inputClass}
                value={toLocal}
                onChange={(e) => setToLocal(e.target.value)}
              />
            </label>
            <label className="block min-w-[12rem] flex-1 text-xs font-medium text-[#64748B]">
              Search
              <input
                type="search"
                placeholder="Search submissions…"
                className={inputClass}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            {fromLocal || toLocal || revisionFilter || search ? (
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-[#64748B] hover:bg-[#F8FAFC]"
                onClick={() => {
                  setRevisionFilter("");
                  setFromLocal("");
                  setToLocal("");
                  setSearch("");
                }}
              >
                Clear
              </button>
            ) : null}
          </div>

          {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}

          {loading ? (
            <p className="text-sm text-[#64748B]">Loading submissions…</p>
          ) : filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E5E7EB] bg-white px-4 py-12 text-center text-[#64748B]">
              No submissions yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-xs font-semibold tracking-wide text-[#64748B]">
                  <tr>
                    <th className="px-3 py-3 whitespace-nowrap">#</th>
                    <th className="px-3 py-3 whitespace-nowrap">Submitted at</th>
                    {columns.map((field) => (
                      <th key={field.id} className="px-3 py-3 whitespace-nowrap">
                        {field.label}
                      </th>
                    ))}
                    <th className="px-3 py-3 whitespace-nowrap">Revision</th>
                    <th className="px-3 py-3 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, index) => {
                    const active = item.id === selectedId;
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-[#E5E7EB]/80 last:border-0 ${
                          active ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <td className="px-3 py-3 font-mono text-xs text-[#94A3B8]">
                          {String(rangeStart + index).padStart(3, "0")}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-[#64748B]">
                          {formatDate(item.createdAt)}
                        </td>
                        {columns.map((field) => {
                          const text = cellValue(item.payload[field.name]);
                          const isEmail = field.type === "email" && text.includes("@");
                          return (
                            <td
                              key={field.id}
                              className="max-w-[14rem] truncate px-3 py-3 text-[#0F172A]"
                              title={text === "—" ? undefined : text}
                            >
                              {isEmail ? (
                                <a
                                  href={`mailto:${text}`}
                                  className="text-[#2563EB] no-underline hover:underline"
                                >
                                  {text}
                                </a>
                              ) : (
                                text
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${revisionBadgeClass(item.revision)}`}
                          >
                            r{item.revision}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <button
                            type="button"
                            className="text-sm font-medium text-[#2563EB] hover:underline"
                            onClick={() => {
                              setSelectedId(item.id);
                              setDetailTab("details");
                            }}
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#64748B]">
            <span>
              {total === 0
                ? "No submissions"
                : `Showing ${rangeStart}–${rangeEnd} of ${total} submissions`}
              {columns.length ? ` · ${columns.length} form fields` : ""}
              {search.trim() ? ` · ${filtered.length} match search on this page` : ""}
            </span>
            {pageCount > 1 ? (
              <nav className="flex flex-wrap items-center gap-0.5" aria-label="Pagination">
                <button
                  type="button"
                  className={pageBtn}
                  disabled={page <= 1 || loading}
                  aria-label="Previous page"
                  onClick={() => void goToPage(page - 1)}
                >
                  ‹
                </button>
                {pageButtons.map((entry, i) =>
                  entry === "ellipsis" ? (
                    <span key={`e-${i}`} className="px-1 text-[#94A3B8]">
                      …
                    </span>
                  ) : (
                    <button
                      key={entry}
                      type="button"
                      className={entry === page ? pageBtnActive : pageBtn}
                      disabled={loading}
                      aria-current={entry === page ? "page" : undefined}
                      onClick={() => void goToPage(entry)}
                    >
                      {entry}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className={pageBtn}
                  disabled={page >= pageCount || loading}
                  aria-label="Next page"
                  onClick={() => void goToPage(page + 1)}
                >
                  ›
                </button>
              </nav>
            ) : null}
          </div>
        </div>

        {selected ? (
          <aside className="w-full shrink-0 rounded-xl border border-[#E5E7EB] bg-white shadow-sm sm:w-80">
            <div className="flex items-start justify-between border-b border-[#E5E7EB] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">
                  Submission #{String(rangeStart + selectedIndex).padStart(3, "0")}
                </p>
                <p className="mt-0.5 text-xs text-[#64748B]">{formatDate(selected.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${revisionBadgeClass(selected.revision)}`}
                >
                  r{selected.revision}
                </span>
                <button
                  type="button"
                  className="rounded-lg p-1 text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  aria-label="Close detail"
                  onClick={() => setSelectedId(null)}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
                    <path
                      d="M5 5l10 10M15 5 5 15"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex gap-1 border-b border-[#E5E7EB] px-3 pt-2">
              <button
                type="button"
                className={`rounded-t-lg px-3 py-2 text-sm ${
                  detailTab === "details"
                    ? "border-b-2 border-[#2563EB] font-medium text-[#2563EB]"
                    : "text-[#64748B]"
                }`}
                onClick={() => setDetailTab("details")}
              >
                Details
              </button>
              <button
                type="button"
                className={`rounded-t-lg px-3 py-2 text-sm ${
                  detailTab === "json"
                    ? "border-b-2 border-[#2563EB] font-medium text-[#2563EB]"
                    : "text-[#64748B]"
                }`}
                onClick={() => setDetailTab("json")}
              >
                JSON
              </button>
            </div>

            <div className="max-h-[min(60vh,28rem)] overflow-y-auto px-4 py-4">
              {detailTab === "details" ? (
                <div className="space-y-3">
                  {(columns.length
                    ? columns.map((f) => ({
                        key: f.name,
                        label: f.label,
                        value: selected.payload[f.name],
                      }))
                    : Object.entries(selected.payload).map(([key, value]) => ({
                        key,
                        label: key,
                        value,
                      }))
                  ).map((row) => {
                    const text = cellValue(row.value);
                    return (
                      <div
                        key={row.key}
                        className="flex items-start justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#64748B]">{row.label}</p>
                          <p className="mt-0.5 break-words text-sm text-[#0F172A]">{text}</p>
                        </div>
                        {text !== "—" ? (
                          <button
                            type="button"
                            className="shrink-0 rounded p-1 text-[#94A3B8] hover:bg-white hover:text-[#0F172A]"
                            title="Copy"
                            onClick={() => void copyText(text)}
                          >
                            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
                              <rect
                                x="7"
                                y="7"
                                width="8"
                                height="8"
                                rx="1.5"
                                stroke="currentColor"
                                strokeWidth="1.4"
                              />
                              <path
                                d="M5 13V5.5A1.5 1.5 0 0 1 6.5 4H13"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <pre className="overflow-x-auto rounded-lg bg-[#F8FAFC] p-3 text-xs text-[#0F172A]">
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              )}
            </div>

            <div className="flex gap-2 border-t border-[#E5E7EB] p-3">
              <button
                type="button"
                className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm disabled:opacity-40"
                disabled={selectedIndex <= 0}
                onClick={() => {
                  const prev = filtered[selectedIndex - 1];
                  if (prev) setSelectedId(prev.id);
                }}
              >
                ← Previous
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
                disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1}
                onClick={() => {
                  const next = filtered[selectedIndex + 1];
                  if (next) setSelectedId(next.id);
                }}
              >
                Next →
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
