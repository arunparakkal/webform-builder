import { formatKeyedStateLine, type KeyedHourRow } from "../lib/hourlySeries";

type Props = {
  rows: KeyedHourRow[];
  /** Dark hub vs light inbox. */
  tone?: "light" | "dark";
  empty?: string;
};

export function KeyedHourlyStateList({
  rows,
  tone = "light",
  empty = "No hourly counts yet. New submissions appear here as keyed (form, hour) totals.",
}: Props) {
  const dark = tone === "dark";
  const live = rows.filter((r) => r.count > 0);

  return (
    <div
      className={
        dark
          ? "rounded-2xl border border-white/15 bg-white/5 px-4 py-4"
          : "rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm"
      }
    >
      <p
        className={
          dark
            ? "text-[11px] font-medium tracking-wide text-white/55 uppercase"
            : "text-[11px] font-medium text-[#64748B]"
        }
      >
        Keyed state · form + hour → count
      </p>
      {live.length === 0 ? (
        <p className={dark ? "mt-2 text-sm text-white/55" : "mt-2 text-sm text-[#94A3B8]"}>
          {empty}
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5 font-mono text-sm">
          {live.map((row) => (
            <li
              key={`${row.formId ?? row.formTitle}-${row.windowStart}`}
              className={dark ? "text-white/90" : "text-[#0F172A]"}
            >
              {formatKeyedStateLine(row)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
