"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Summary = {
  current: number;
  best: number;
  appliedToday: boolean;
  weekCount: number;
  weekGoal: number;
  last7: { label: string; applied: boolean; today: boolean }[];
};

const GOALS = [5, 10, 15, 20, 30, 50];

// Dashboard card: current apply streak, the last 7 days, and the weekly goal.
export default function StreakCard({ summary }: { summary: Summary }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { current, best, appliedToday, weekCount, weekGoal, last7 } = summary;
  const pct = Math.min(100, Math.round((weekCount / weekGoal) * 100));
  const left = Math.max(0, weekGoal - weekCount);

  const headline = current > 0 ? `${current}-day streak` : "Start your streak today";
  const sub =
    current === 0
      ? "Apply to one role today — every day you apply adds to your streak."
      : appliedToday
        ? `You've applied ${current} day${current === 1 ? "" : "s"} in a row — keep it going!`
        : "Apply today to keep your streak alive — it resets at midnight.";

  async function saveGoal(goal: number) {
    setSaving(true);
    try {
      await fetch("/api/streak/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="sk-card">
      <div className="sk-top">
        <div className="sk-streak">
          <div aria-hidden="true" className={`sk-flame${current > 0 ? "" : " sk-flame-off"}`}>
            🔥
          </div>
          <div>
            <p className="sk-big">{headline}</p>
            <p className="sk-sub">{sub}</p>
          </div>
        </div>
        {best > 0 && <span className="sk-best">Best: {best} day{best === 1 ? "" : "s"}</span>}
      </div>

      <div aria-label="Your last 7 days" className="sk-days">
        {last7.map((d) => (
          <div className={`sk-day${d.applied ? " sk-on" : ""}${d.today ? " sk-today" : ""}`} key={d.label}>
            <b>{d.applied ? "✓" : d.today ? "?" : "·"}</b>
            <small>{d.label}</small>
          </div>
        ))}
      </div>

      <div className="sk-goal">
        <div className="sk-goal-head">
          <span>This week&apos;s goal</span>
          <span className="sk-goal-count">
            {weekCount} / {weekGoal} applications
            {!editing && (
              <button className="sk-edit" onClick={() => setEditing(true)} type="button">
                Edit
              </button>
            )}
          </span>
        </div>
        {editing && (
          <div className="sk-goal-pick">
            {GOALS.map((g) => (
              <button
                className={`sk-goal-opt${g === weekGoal ? " sk-goal-opt-on" : ""}`}
                disabled={saving}
                key={g}
                onClick={() => saveGoal(g)}
                type="button"
              >
                {g}/week
              </button>
            ))}
          </div>
        )}
        <div aria-label={`${pct}% of weekly goal`} className="sk-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <p className="sk-hint">
          {left > 0 ? (
            <>
              Apply to <b>{left} more</b> to hit your goal · new roles are added every day
            </>
          ) : (
            <>
              🎉 <b>Goal reached!</b> Keep going — every extra application is another chance.
            </>
          )}
        </p>
        <Link className="sk-cta" href="/opportunities">
          Apply to today&apos;s roles →
        </Link>
      </div>
    </section>
  );
}
