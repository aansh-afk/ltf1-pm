/**
 * LTF1 TUI Dashboard - Full Screen Application
 * Pure black background, fills entire terminal
 * Exclusive page views: Dashboard, Tasks, Sprint, Git
 * Character-level coloring using nested Text components
 */

import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";

// Colors - Strictly black and white with shades
const BG = "#000000";
const WHITE = "#ffffff";
const LIGHT = "#cccccc";
const GRAY = "#888888";
const DIM = "#555555";
const DARK = "#333333";

type View = "dashboard" | "tasks" | "sprint" | "git";

interface AppProps {
  initialView?: View;
}

// Each segment has text and color
type Segment = { text: string; color: string };

// A row is always an array of segments for character-level coloring
type Row = {
  segments: Segment[];
  bgColor?: string;
};

// Helper to create a simple single-color row
const row = (text: string, color: string, bgColor?: string): Row => ({
  segments: [{ text, color }],
  bgColor,
});

// Helper to create a multi-segment row
const segRow = (segments: Segment[], bgColor?: string): Row => ({
  segments,
  bgColor,
});

export function App({ initialView = "dashboard" }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [width, setWidth] = useState(stdout?.columns || 120);
  const [height, setHeight] = useState(stdout?.rows || 30);
  const [view, setView] = useState<View>(initialView);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (stdout) {
        setWidth(stdout.columns);
        setHeight(stdout.rows);
      }
    };
    stdout?.on("resize", handleResize);
    return () => {
      stdout?.off("resize", handleResize);
    };
  }, [stdout]);

  useInput((input, key) => {
    if (input === "q" || (key.ctrl && input === "c")) {
      exit();
    }

    if (view === "dashboard") {
      if (key.upArrow) setSelectedIndex((i) => Math.max(0, i - 1));
      if (key.downArrow) setSelectedIndex((i) => Math.min(3, i + 1));
      if (key.return) {
        const views: View[] = ["tasks", "sprint", "git", "dashboard"];
        if (selectedIndex < 3) setView(views[selectedIndex]);
        else exit();
      }
      if (input === "t" || input === "1") setView("tasks");
      if (input === "s" || input === "2") setView("sprint");
      if (input === "g" || input === "3") setView("git");
    } else {
      if (key.escape || input === "b") setView("dashboard");
      if (input === "t") setView("tasks");
      if (input === "s") setView("sprint");
      if (input === "g") setView("git");
      if (input === "d") setView("dashboard");
    }
  });

  const W = Math.max(width, 100);
  const H = Math.max(height, 30);

  const rep = (char: string, n: number): string => char.repeat(Math.max(0, n));
  const pad = (text: string, len: number): string => {
    if (text.length >= len) return text.slice(0, len);
    return text + " ".repeat(len - text.length);
  };
  const center = (text: string, len: number): string => {
    if (text.length >= len) return text.slice(0, len);
    const left = Math.floor((len - text.length) / 2);
    return " ".repeat(left) + text + " ".repeat(len - text.length - left);
  };

  // Helper to pad segments to fill width
  const padSegments = (segs: Segment[], totalWidth: number): Segment[] => {
    const currentLen = segs.reduce((sum, s) => sum + s.text.length, 0);
    if (currentLen >= totalWidth) return segs;
    return [...segs, { text: " ".repeat(totalWidth - currentLen), color: WHITE }];
  };

  const timeStr = time.toLocaleTimeString("en-GB", { hour12: false });
  const dateStr = time
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    .toUpperCase()
    .replace(",", "");

  const renderView = (): Row[] => {
    switch (view) {
      case "dashboard":
        return renderDashboard();
      case "tasks":
        return renderTasks();
      case "sprint":
        return renderSprint();
      case "git":
        return renderGit();
    }
  };

  const renderDashboard = (): Row[] => {
    const rows: Row[] = [];

    // Header with mixed colors
    rows.push(segRow(padSegments([
      { text: "  LTF1 ", color: WHITE },
      { text: "V0.1.0", color: LIGHT },
      { text: "  |  ", color: DIM },
      { text: "●", color: WHITE },
      { text: " SYSTEM READY", color: WHITE },
      { text: rep(" ", W - 50 - timeStr.length - dateStr.length), color: WHITE },
      { text: timeStr, color: LIGHT },
      { text: " • ", color: DIM },
      { text: dateStr, color: GRAY },
      { text: "  ", color: WHITE },
    ], W)));
    rows.push(row(rep("─", W), DIM));

    // Empty space before logo
    for (let i = 0; i < 4; i++) {
      rows.push(row(pad("", W), WHITE));
    }

    // Logo
    const logo = [
      "      _      _____  ______ _ ",
      "     | |    |_   _||  ____/ |",
      "     | |      | |  | |__  | |",
      "     | |      | |  |  __| | |",
      "     | |____ _| |_ | |    | |",
      "     |______|_____||_|    |_|",
    ];
    const logoWidth = 29;
    const logoLeft = Math.floor((W - logoWidth) / 2);

    for (const line of logo) {
      rows.push(row(pad(rep(" ", logoLeft) + line, W), WHITE));
    }

    rows.push(row(pad("", W), WHITE));
    rows.push(row(center("L E G A C Y   T A S K   F R A M E W O R K", W), GRAY));

    // Empty space
    for (let i = 0; i < 3; i++) {
      rows.push(row(pad("", W), WHITE));
    }

    // Menu - clean design with top/bottom borders only
    const boxWidth = 50;
    const boxLeft = Math.floor((W - boxWidth) / 2);
    const menuItems = [
      { key: "T", label: "TASKS", desc: "View and manage your tasks" },
      { key: "S", label: "SPRINT", desc: "Sprint progress and metrics" },
      { key: "G", label: "GIT", desc: "Git status and history" },
      { key: "Q", label: "QUIT", desc: "Exit to shell" },
    ];

    // Top border
    rows.push(row(pad(rep(" ", boxLeft) + rep("─", boxWidth), W), DIM));

    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      const isSelected = i === selectedIndex;

      // Build content: " [K]  LABEL" + spaces + "description"
      const keyPart = `[${item.key}]`;
      const labelPart = item.label;
      const descPart = item.desc;

      if (isSelected) {
        // Selected row with inverted colors
        const content = ` ${keyPart}  ${labelPart}`;
        const fullContent = content + rep(" ", boxWidth - content.length - descPart.length - 1) + descPart + " ";
        rows.push({
          segments: padSegments([
            { text: rep(" ", boxLeft) + fullContent, color: BG },
          ], W),
          bgColor: WHITE,
        });
      } else {
        // Non-selected row with character-level coloring
        rows.push(segRow(padSegments([
          { text: rep(" ", boxLeft) + " ", color: WHITE },
          { text: keyPart, color: LIGHT },
          { text: "  ", color: WHITE },
          { text: labelPart, color: WHITE },
          { text: rep(" ", boxWidth - 4 - keyPart.length - labelPart.length - descPart.length), color: WHITE },
          { text: descPart, color: GRAY },
          { text: " ", color: WHITE },
        ], W)));
      }
    }

    // Bottom border
    rows.push(row(pad(rep(" ", boxLeft) + rep("─", boxWidth), W), DIM));

    // Terminal output section
    for (let i = 0; i < 2; i++) rows.push(row(pad("", W), WHITE));
    rows.push(segRow(padSegments([
      { text: rep(" ", boxLeft) + "$ ", color: WHITE },
      { text: "ltf1 --status", color: WHITE },
    ], W)));
    rows.push(segRow(padSegments([
      { text: rep(" ", boxLeft) + "[", color: DIM },
      { text: "INFO", color: LIGHT },
      { text: "] Connected to local instance at ", color: DIM },
      { text: ":4000", color: WHITE },
    ], W)));
    rows.push(segRow(padSegments([
      { text: rep(" ", boxLeft) + "[", color: DIM },
      { text: "INFO", color: LIGHT },
      { text: "] Scanning for repository updates... ", color: DIM },
      { text: "Done.", color: WHITE },
    ], W)));
    rows.push(segRow(padSegments([
      { text: rep(" ", boxLeft), color: WHITE },
      { text: "_", color: WHITE },
    ], W)));

    // Fill remaining
    while (rows.length < H - 2) {
      rows.push(row(pad("", W), WHITE));
    }

    // Footer
    rows.push(row(rep("─", W), DIM));
    rows.push(segRow(padSegments([
      { text: "  ", color: GRAY },
      { text: "⇅", color: LIGHT },
      { text: " Navigate    ", color: GRAY },
      { text: "ENTER", color: LIGHT },
      { text: " Select    ", color: GRAY },
      { text: "ESC", color: LIGHT },
      { text: " Back    ", color: GRAY },
      { text: "T/S/G", color: LIGHT },
      { text: " Quick Jump", color: GRAY },
      { text: rep(" ", W - 80), color: GRAY },
      { text: "\"Simple is better than complex.\"", color: DIM },
      { text: "  ", color: GRAY },
    ], W)));

    return rows;
  };

  const renderTasks = (): Row[] => {
    const rows: Row[] = [];

    // Header
    rows.push(segRow(padSegments([
      { text: "  KANBAN BOARD  ", color: WHITE },
      { text: "v1.0.4-stable", color: LIGHT },
      { text: rep(" ", W - 45), color: WHITE },
      { text: "[", color: DIM },
      { text: "ESC", color: LIGHT },
      { text: "] Back  ", color: DIM },
    ], W)));
    rows.push(row(rep("─", W), DIM));
    rows.push(row(pad("", W), WHITE));

    // Tasks data
    const todoTasks = [
      { id: "ICE-270", title: "Write unit tests for authentication flow", priority: "LOW" as const },
      { id: "ICE-271", title: "Update documentation for API endpoints", priority: "LOW" as const },
      { id: "ICE-275", title: "Add input validation to forms", priority: "MED" as const },
    ];
    const inProgressTasks = [
      { id: "ICE-234", title: "Fix auth redirect loops on mobile devices", priority: "HIGH" as const, active: true },
      { id: "ICE-241", title: "Add system-level dark mode detection", priority: "MED" as const },
    ];
    const doneTasks = [
      { id: "ICE-220", title: "Setup CI/CD pipeline with GitHub Actions", priority: "HIGH" as const },
      { id: "ICE-215", title: "Initial project structure and dependencies", priority: "MED" as const },
      { id: "ICE-210", title: "Create database schema", priority: "HIGH" as const },
      { id: "ICE-205", title: "Setup development environment", priority: "LOW" as const },
    ];

    const colWidth = Math.floor((W - 8) / 3);

    // Column headers with colors
    rows.push(segRow(padSegments([
      { text: "  ┌─ ", color: DIM },
      { text: "TODO", color: GRAY },
      { text: ` [${todoTasks.length}] ` + rep("─", colWidth - 14) + "┐ ", color: DIM },
      { text: "┌─ ", color: DIM },
      { text: "IN PROGRESS", color: LIGHT },
      { text: ` [${inProgressTasks.length}] ` + rep("─", colWidth - 21) + "┐ ", color: DIM },
      { text: "┌─ ", color: DIM },
      { text: "DONE", color: WHITE },
      { text: ` [${doneTasks.length}] ` + rep("─", colWidth - 14) + "┐", color: DIM },
    ], W)));

    const maxTasks = Math.max(todoTasks.length, inProgressTasks.length, doneTasks.length, 6);

    for (let i = 0; i < maxTasks; i++) {
      const todo = todoTasks[i];
      const inProg = inProgressTasks[i];
      const done = doneTasks[i];

      const getPrioColor = (p: "HIGH" | "MED" | "LOW") => p === "HIGH" ? WHITE : p === "MED" ? LIGHT : GRAY;
      const getPrioText = (p: "HIGH" | "MED" | "LOW") => p === "HIGH" ? "!!" : p === "MED" ? "! " : "  ";

      // Build segments for each column
      const buildTaskLine = (task: typeof todoTasks[0] | undefined, w: number, isActive = false): Segment[] => {
        if (!task) return [{ text: "│" + rep(" ", w - 2) + "│", color: DIM }];
        const prio = getPrioText(task.priority);
        const prioColor = getPrioColor(task.priority);
        const activeMarker = isActive ? " ●" : "  ";
        const remaining = w - 4 - prio.length - task.id.length - activeMarker.length - 1;
        return [
          { text: "│ ", color: DIM },
          { text: prio, color: prioColor },
          { text: task.id, color: WHITE },
          { text: activeMarker, color: isActive ? WHITE : GRAY },
          { text: rep(" ", remaining) + "│", color: DIM },
        ];
      };

      const buildTitleLine = (task: typeof todoTasks[0] | undefined, w: number): Segment[] => {
        if (!task) return [{ text: "│" + rep(" ", w - 2) + "│", color: DIM }];
        const title = task.title.slice(0, w - 6);
        return [
          { text: "│    ", color: DIM },
          { text: title, color: GRAY },
          { text: rep(" ", w - 5 - title.length) + "│", color: DIM },
        ];
      };

      // ID line
      const segs1: Segment[] = [{ text: "  ", color: WHITE }];
      segs1.push(...buildTaskLine(todo, colWidth));
      segs1.push({ text: " ", color: WHITE });
      segs1.push(...buildTaskLine(inProg, colWidth, inProg?.active));
      segs1.push({ text: " ", color: WHITE });
      segs1.push(...buildTaskLine(done, colWidth));
      rows.push(segRow(padSegments(segs1, W)));

      // Title line
      const segs2: Segment[] = [{ text: "  ", color: WHITE }];
      segs2.push(...buildTitleLine(todo, colWidth));
      segs2.push({ text: " ", color: WHITE });
      segs2.push(...buildTitleLine(inProg, colWidth));
      segs2.push({ text: " ", color: WHITE });
      segs2.push(...buildTitleLine(done, colWidth));
      rows.push(segRow(padSegments(segs2, W)));

      // Spacer
      rows.push(segRow(padSegments([
        { text: "  │" + rep(" ", colWidth - 2) + "│ │" + rep(" ", colWidth - 2) + "│ │" + rep(" ", colWidth - 2) + "│", color: DIM },
      ], W)));
    }

    // Column footers
    rows.push(row(pad(`  ${"└" + rep("─", colWidth - 2) + "┘"} ${"└" + rep("─", colWidth - 2) + "┘"} ${"└" + rep("─", colWidth - 2) + "┘"}`, W), DIM));

    rows.push(row(pad("", W), WHITE));

    // Summary with colors
    const total = todoTasks.length + inProgressTasks.length + doneTasks.length;
    rows.push(segRow(padSegments([
      { text: "  TOTAL: ", color: GRAY },
      { text: `${total}`, color: WHITE },
      { text: " tasks    TODO: ", color: GRAY },
      { text: `${todoTasks.length}`, color: GRAY },
      { text: "    IN PROGRESS: ", color: GRAY },
      { text: `${inProgressTasks.length}`, color: LIGHT },
      { text: "    DONE: ", color: GRAY },
      { text: `${doneTasks.length}`, color: WHITE },
    ], W)));

    // Fill remaining
    while (rows.length < H - 2) {
      rows.push(row(pad("", W), WHITE));
    }

    // Footer
    rows.push(row(rep("─", W), DIM));
    rows.push(segRow(padSegments([
      { text: "  [", color: DIM },
      { text: "N", color: LIGHT },
      { text: "] New    [", color: DIM },
      { text: "M", color: LIGHT },
      { text: "] Move    [", color: DIM },
      { text: "E", color: LIGHT },
      { text: "] Edit    [", color: DIM },
      { text: "D", color: LIGHT },
      { text: "] Delete    [", color: DIM },
      { text: "ESC", color: LIGHT },
      { text: "] Back    [", color: DIM },
      { text: "Q", color: LIGHT },
      { text: "] Quit", color: DIM },
    ], W)));

    return rows;
  };

  const renderGit = (): Row[] => {
    const rows: Row[] = [];

    // Header
    rows.push(segRow(padSegments([
      { text: "  GIT STATUS  ", color: WHITE },
      { text: "v2.41.0", color: LIGHT },
      { text: rep(" ", W - 40), color: WHITE },
      { text: "[", color: DIM },
      { text: "ESC", color: LIGHT },
      { text: "] Back  ", color: DIM },
    ], W)));
    rows.push(row(rep("─", W), DIM));
    rows.push(row(pad("", W), WHITE));

    // Current branch section
    rows.push(segRow(padSegments([
      { text: "  ── ", color: DIM },
      { text: "CURRENT BRANCH", color: WHITE },
      { text: " " + rep("─", 54), color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    rows.push(segRow(padSegments([
      { text: "  BRANCH       ", color: GRAY },
      { text: "feature/cli-dashboard", color: LIGHT },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  REMOTE       ", color: GRAY },
      { text: "origin/feature/cli-dashboard", color: WHITE },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  STATUS       ", color: GRAY },
      { text: "●", color: WHITE },
      { text: " Up to date with remote", color: WHITE },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    // Staged changes
    rows.push(segRow(padSegments([
      { text: "  ── ", color: DIM },
      { text: "STAGED CHANGES", color: WHITE },
      { text: " (", color: DIM },
      { text: "2", color: WHITE },
      { text: " files) " + rep("─", 40), color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    rows.push(segRow(padSegments([
      { text: "  ", color: WHITE },
      { text: "M", color: WHITE },
      { text: "   src/tui/App.tsx", color: WHITE },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  ", color: WHITE },
      { text: "M", color: WHITE },
      { text: "   src/tui/index.tsx", color: GRAY },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    // Unstaged changes
    rows.push(segRow(padSegments([
      { text: "  ── ", color: DIM },
      { text: "UNSTAGED CHANGES", color: WHITE },
      { text: " (", color: DIM },
      { text: "0", color: GRAY },
      { text: " files) " + rep("─", 38), color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));
    rows.push(row(pad("      No unstaged changes", W), GRAY));
    rows.push(row(pad("", W), WHITE));

    // Branches section
    rows.push(segRow(padSegments([
      { text: "  ── ", color: DIM },
      { text: "BRANCHES", color: WHITE },
      { text: " " + rep("─", 60), color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    const branches = [
      { name: "feature/cli-dashboard", updated: "2h ago", commit: "fix tui layout", current: true },
      { name: "main", updated: "1d ago", commit: "merge pr #42", current: false },
      { name: "feature/auth-flow", updated: "3d ago", commit: "add oauth handlers", current: false },
      { name: "develop", updated: "5d ago", commit: "sprint 11 release", current: false },
    ];

    rows.push(segRow(padSegments([
      { text: `  ${"NAME".padEnd(28)} `, color: GRAY },
      { text: `${"UPDATED".padEnd(12)} `, color: GRAY },
      { text: "LAST COMMIT", color: GRAY },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    for (const b of branches) {
      if (b.current) {
        rows.push(segRow(padSegments([
          { text: "  ", color: WHITE },
          { text: "* ", color: WHITE },
          { text: b.name.padEnd(26) + " ", color: LIGHT },
          { text: b.updated.padEnd(12) + " ", color: GRAY },
          { text: b.commit, color: WHITE },
        ], W)));
      } else {
        rows.push(segRow(padSegments([
          { text: "    ", color: WHITE },
          { text: b.name.padEnd(26) + " ", color: WHITE },
          { text: b.updated.padEnd(12) + " ", color: DIM },
          { text: b.commit, color: GRAY },
        ], W)));
      }
    }

    rows.push(row(pad("", W), WHITE));

    // Recent commits section
    rows.push(segRow(padSegments([
      { text: "  ── ", color: DIM },
      { text: "RECENT COMMITS", color: WHITE },
      { text: " " + rep("─", 54), color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    const commits = [
      { hash: "a1b2c3d", time: "2 hours ago", msg: "fix tui layout and colors" },
      { hash: "e4f5g6h", time: "4 hours ago", msg: "add fullscreen mode toggle" },
      { hash: "i7j8k9l", time: "6 hours ago", msg: "implement dashboard view modules" },
      { hash: "m0n1o2p", time: "1 day ago", msg: "setup tui infrastructure" },
      { hash: "q3r4s5t", time: "1 day ago", msg: "add ink dependencies" },
    ];

    rows.push(segRow(padSegments([
      { text: `  ${"HASH".padEnd(10)} `, color: GRAY },
      { text: `${"TIME".padEnd(14)} `, color: GRAY },
      { text: "MESSAGE", color: GRAY },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    for (const c of commits) {
      rows.push(segRow(padSegments([
        { text: "  ", color: WHITE },
        { text: c.hash.padEnd(10) + " ", color: GRAY },
        { text: c.time.padEnd(14) + " ", color: DIM },
        { text: c.msg, color: WHITE },
      ], W)));
    }

    rows.push(row(pad("", W), WHITE));

    // Statistics
    rows.push(segRow(padSegments([
      { text: "  ── ", color: DIM },
      { text: "STATISTICS", color: WHITE },
      { text: " " + rep("─", 58), color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    rows.push(segRow(padSegments([
      { text: "  COMMITS TODAY     ", color: GRAY },
      { text: "3", color: WHITE },
      { text: "                LINES ADDED       ", color: GRAY },
      { text: "+245", color: WHITE },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  COMMITS WEEK     ", color: GRAY },
      { text: "12", color: WHITE },
      { text: "                LINES REMOVED     ", color: GRAY },
      { text: "-87", color: DIM },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  FILES CHANGED     ", color: GRAY },
      { text: "8", color: WHITE },
      { text: "                NET CHANGE        ", color: GRAY },
      { text: "+158", color: WHITE },
    ], W)));

    // Fill remaining
    while (rows.length < H - 2) {
      rows.push(row(pad("", W), WHITE));
    }

    // Footer
    rows.push(row(rep("─", W), DIM));
    rows.push(segRow(padSegments([
      { text: "  [", color: DIM },
      { text: "C", color: LIGHT },
      { text: "] Commit    [", color: DIM },
      { text: "P", color: LIGHT },
      { text: "] Push    [", color: DIM },
      { text: "L", color: LIGHT },
      { text: "] Pull    [", color: DIM },
      { text: "B", color: LIGHT },
      { text: "] Branches    [", color: DIM },
      { text: "ESC", color: LIGHT },
      { text: "] Back    [", color: DIM },
      { text: "Q", color: LIGHT },
      { text: "] Quit", color: DIM },
    ], W)));

    return rows;
  };

  const renderSprint = (): Row[] => {
    const rows: Row[] = [];

    // Header
    rows.push(segRow(padSegments([
      { text: "  SPRINT DASHBOARD  ", color: WHITE },
      { text: "V2.4.0", color: LIGHT },
      { text: rep(" ", W - 80), color: WHITE },
      { text: "SESSION: ", color: GRAY },
      { text: "ADMIN@LOCAL", color: WHITE },
      { text: "    UPTIME: ", color: GRAY },
      { text: "12D 04H 21M", color: WHITE },
      { text: "    ", color: WHITE },
      { text: timeStr, color: LIGHT },
      { text: "  ", color: WHITE },
    ], W)));
    rows.push(row(rep("─", W), DIM));
    rows.push(row(pad("", W), WHITE));

    // Sprint title
    rows.push(segRow(padSegments([
      { text: "  SPRINT ", color: WHITE },
      { text: "12", color: LIGHT },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  DURATION: ", color: GRAY },
      { text: "14 DAYS", color: WHITE },
      { text: "  —  [ ", color: GRAY },
      { text: "4 DAYS REMAINING", color: GRAY },
      { text: " ]", color: GRAY },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  JAN 14, 2026  ", color: DIM },
      { text: "→", color: LIGHT },
      { text: "  JAN 28, 2026", color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    // Progress section
    rows.push(segRow(padSegments([
      { text: "  ── ", color: DIM },
      { text: "PROGRESS", color: WHITE },
      { text: " " + rep("─", 60), color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    const progBarW = 50;
    const progFilled = Math.floor(0.67 * progBarW);
    rows.push(segRow(padSegments([
      { text: "  COMPLETION    [", color: GRAY },
      { text: rep("█", progFilled), color: WHITE },
      { text: rep("░", progBarW - progFilled), color: DIM },
      { text: "]  ", color: GRAY },
      { text: "67%", color: WHITE },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "                ", color: WHITE },
      { text: "14", color: WHITE },
      { text: " of ", color: GRAY },
      { text: "21", color: WHITE },
      { text: " tasks completed", color: GRAY },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    // Task Breakdown
    rows.push(segRow(padSegments([
      { text: "  ── ", color: DIM },
      { text: "TASK BREAKDOWN", color: WHITE },
      { text: " " + rep("─", 54), color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    const bw = 30;
    rows.push(segRow(padSegments([
      { text: "  TODO          ", color: GRAY },
      { text: rep("█", 4), color: GRAY },
      { text: rep("░", bw - 4), color: DIM },
      { text: "   ", color: WHITE },
      { text: "3", color: GRAY },
      { text: " tasks   (14%)", color: GRAY },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  IN PROGRESS   ", color: GRAY },
      { text: rep("█", 6), color: LIGHT },
      { text: rep("░", bw - 6), color: DIM },
      { text: "   ", color: WHITE },
      { text: "4", color: LIGHT },
      { text: " tasks   (19%)", color: GRAY },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  DONE          ", color: GRAY },
      { text: rep("█", 20), color: WHITE },
      { text: rep("░", bw - 20), color: DIM },
      { text: "  ", color: WHITE },
      { text: "14", color: WHITE },
      { text: " tasks   (67%)", color: GRAY },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    // Burndown
    rows.push(segRow(padSegments([
      { text: "  ── ", color: DIM },
      { text: "BURNDOWN CHART", color: WHITE },
      { text: " " + rep("─", 54), color: DIM },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "                                          ", color: WHITE },
      { text: "■", color: WHITE },
      { text: " ACTUAL   ", color: GRAY },
      { text: "░", color: DIM },
      { text: " IDEAL", color: GRAY },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    const burndownData = [
      { day: "DAY 01", actual: 21, ideal: 21 },
      { day: "DAY 03", actual: 18, ideal: 18 },
      { day: "DAY 05", actual: 15, ideal: 15 },
      { day: "DAY 07", actual: 12, ideal: 12 },
      { day: "DAY 09", actual: 10, ideal: 9 },
      { day: "DAY 11", actual: 8, ideal: 6 },
      { day: "DAY 14", actual: 7, ideal: 0, today: true },
    ];

    for (const d of burndownData) {
      const onTrack = d.actual <= d.ideal + 2;
      rows.push(segRow(padSegments([
        { text: `  ${d.day}   `, color: GRAY },
        { text: rep("█", d.actual), color: onTrack ? WHITE : GRAY },
        { text: rep("░", 21 - d.actual), color: DIM },
        { text: `  ${String(d.actual).padStart(2)}`, color: WHITE },
        { text: d.today ? "  ← TODAY" : "", color: LIGHT },
      ], W)));
    }

    rows.push(row(pad("", W), WHITE));
    rows.push(segRow(padSegments([
      { text: "  IDEAL: ", color: GRAY },
      { text: "00", color: WHITE },
      { text: "   ACTUAL: ", color: GRAY },
      { text: "07", color: GRAY },
      { text: "   DELTA: ", color: GRAY },
      { text: "+7 tasks behind", color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    // Metrics
    rows.push(segRow(padSegments([
      { text: "  ── ", color: DIM },
      { text: "METRICS", color: WHITE },
      { text: " " + rep("─", 61), color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    rows.push(segRow(padSegments([
      { text: "  VELOCITY        ", color: GRAY },
      { text: "21", color: WHITE },
      { text: " pts/sprint (team average)", color: GRAY },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  BURN RATE       ", color: GRAY },
      { text: "3.5", color: WHITE },
      { text: " tasks/day", color: GRAY },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  CYCLE TIME      ", color: GRAY },
      { text: "1.2", color: WHITE },
      { text: " days/task (average)", color: GRAY },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  SCOPE CHANGE    ", color: GRAY },
      { text: "+2", color: GRAY },
      { text: " tasks added mid-sprint", color: GRAY },
    ], W)));
    rows.push(segRow(padSegments([
      { text: "  BLOCKERS        ", color: GRAY },
      { text: "0", color: WHITE },
      { text: " active", color: GRAY },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    // Velocity trend
    rows.push(segRow(padSegments([
      { text: "  ── ", color: DIM },
      { text: "VELOCITY TREND", color: WHITE },
      { text: " " + rep("─", 54), color: DIM },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    const velocityData = [
      { sprint: "SPR 09", pts: 14 },
      { sprint: "SPR 10", pts: 20 },
      { sprint: "SPR 11", pts: 21 },
      { sprint: "SPR 12", pts: 14, current: true },
    ];

    for (const v of velocityData) {
      rows.push(segRow(padSegments([
        { text: `  ${v.sprint}   `, color: GRAY },
        { text: rep("█", v.pts), color: v.current ? DIM : WHITE },
        { text: `  ${v.pts} pts`, color: WHITE },
        { text: v.current ? " (in progress)" : "", color: GRAY },
      ], W)));
    }

    // Fill remaining
    while (rows.length < H - 5) {
      rows.push(row(pad("", W), WHITE));
    }

    // Bottom stats
    rows.push(row(rep("─", W), DIM));
    rows.push(segRow(padSegments([
      { text: "  POINTS LEFT: ", color: GRAY },
      { text: "07", color: GRAY },
      { text: "    DEVIATION: ", color: GRAY },
      { text: "-0.4", color: WHITE },
      { text: "    TOTAL: ", color: GRAY },
      { text: "21", color: WHITE },
      { text: "    BLOCKERS: ", color: GRAY },
      { text: "00", color: WHITE },
      { text: "    AVG VELOCITY: ", color: GRAY },
      { text: "19 pts", color: WHITE },
    ], W)));
    rows.push(row(pad("", W), WHITE));

    // Footer
    rows.push(row(rep("─", W), DIM));
    rows.push(segRow(padSegments([
      { text: "  [", color: DIM },
      { text: "ESC", color: LIGHT },
      { text: "] BACK    [", color: DIM },
      { text: "D", color: LIGHT },
      { text: "] DASHBOARD    [", color: DIM },
      { text: "T", color: LIGHT },
      { text: "] TASKS    [", color: DIM },
      { text: "G", color: LIGHT },
      { text: "] GIT    [", color: DIM },
      { text: "Q", color: LIGHT },
      { text: "] QUIT", color: DIM },
      { text: rep(" ", W - 85), color: WHITE },
      { text: "COMMAND: ", color: GRAY },
      { text: "_", color: WHITE },
    ], W)));

    return rows;
  };

  const rows = renderView();

  return (
    <Box flexDirection="column" width={W} height={H}>
      {rows.map((r, i) => (
        <Text key={i} backgroundColor={r.bgColor || BG}>
          {r.segments.map((seg, j) => (
            <Text key={j} color={seg.color}>
              {seg.text}
            </Text>
          ))}
        </Text>
      ))}
    </Box>
  );
}

export default App;
