"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountWorkspace } from "./account-workspace";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/src/lib/api-client";

type Section = "expenses" | "accounts" | "split";
type Category =
  | "Food"
  | "Stationery"
  | "Travel"
  | "Shopping"
  | "Bills"
  | "Entertainment"
  | "Health"
  | "Other";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
};

type FirebaseAuth = {
  RecaptchaVerifier: new (
    container: string,
    parameters: { size: "invisible" },
    auth: unknown,
  ) => { render: () => Promise<number> };
  signInWithPhoneNumber: (
    phoneNumber: string,
    appVerifier: unknown,
  ) => Promise<{ confirm: (code: string) => Promise<{ user: { getIdToken: () => Promise<string> } }> }>;
  currentUser: FirebaseUser | null;
};

type FirebaseUser = {
  getIdToken: () => Promise<string>;
  linkWithPopup: (provider: unknown) => Promise<{ user: FirebaseUser }>;
};

type FirebaseCompat = {
  initializeApp: (config: Record<string, string>) => unknown;
  apps: unknown[];
  auth: (() => FirebaseAuth) & { GoogleAuthProvider: new () => unknown };
};

declare global {
  interface Window {
    firebase?: FirebaseCompat;
  }
}

type PersonalExpense = {
  id: string;
  title: string;
  amount: number;
  amountMinor: string;
  currency: string;
  category: Category;
  expenseDate: string;
  notes?: string | null;
  createdAt: string;
};

type MonthBreakdown = {
  monthNumber: number;
  monthKey: string;
  monthName: string;
  totalMinor: number;
  totalAmount: number;
  count: number;
};

type YearSummary = {
  year: number;
  totalMinor: number;
  totalAmount: number;
  count: number;
};

type Group = {
  id: string;
  name: string;
  members: number;
  total: number;
  color: string;
};

type Screen = "splash" | "login" | "dashboard";

const categoryMeta: Record<Category, { icon: string; bg: string }> = {
  Food: { icon: "🍜", bg: "bg-[var(--status-owe-bg)]" },
  Stationery: { icon: "✏️", bg: "bg-[var(--accent-yellow-light)]" },
  Travel: { icon: "🚌", bg: "bg-[#e9e8f7]" },
  Shopping: { icon: "🛒", bg: "bg-[var(--status-receive-bg)]" },
  Bills: { icon: "💡", bg: "bg-[#e8f0f8]" },
  Entertainment: { icon: "🍿", bg: "bg-[#fde2e4]" },
  Health: { icon: "💊", bg: "bg-[#e2ece9]" },
  Other: { icon: "📦", bg: "bg-[#f0f0f0]" },
};

function formatMoney(amount: number) {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: amount % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateDisplay(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${dateStr}T00:00:00`));
  } catch {
    return dateStr;
  }
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const router = useRouter();
  const [today, setToday] = useState("");
  const currentYear = today ? Number(today.slice(0, 4)) : 0;

  const [screen, setScreen] = useState<Screen>("splash");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [authMethod, setAuthMethod] = useState<"phone" | "google">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneConfirmation, setPhoneConfirmation] = useState<Awaited<ReturnType<FirebaseAuth["signInWithPhoneNumber"]>> | null>(null);

  // Authentication state
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState("");

  // Workspace navigation
  const [section, setSection] = useState<Section>("expenses");

  // Expenses & Yearly/Monthly filters
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [allYears, setAllYears] = useState<number[]>([currentYear]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthBreakdown[]>([]);
  const [allYearsSummary, setAllYearsSummary] = useState<YearSummary[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    Array<{ category: string; totalAmount: number; count: number }>
  >([]);
  const [yearStats, setYearStats] = useState({
    totalAmount: 0,
    count: 0,
    averageMonthlyAmount: 0,
  });
  const [expensesLoading, setExpensesLoading] = useState(false);

  // Add Expense form state
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<Category>("Food");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState("");
  const [groupName, setGroupName] = useState("");

  // Initialize today's date safely
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentDate = getTodayString();
      setToday(currentDate);
      setExpenseDate(currentDate);
      const yrStr = currentDate.slice(0, 4);
      setSelectedYear(yrStr);
      setSelectedMonth(`${yrStr}-${currentDate.slice(5, 7)}`);
      setAllYears([Number(yrStr)]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Check auth on startup (session persistence - only asks to login first time)
  useEffect(() => {
    let isMounted = true;
    const callbackError = new URLSearchParams(window.location.search).get("error");
    if (callbackError) {
      const messages: Record<string, string> = {
        google_credentials_missing: "Google sign-in is not configured on this server.",
        token_exchange_failed: "Google sign-in could not be completed.",
        missing_access_token: "Google did not return an access token.",
        userinfo_failed: "Google account details could not be loaded.",
        invalid_google_profile: "Google returned an incomplete account profile.",
        oauth_error: "Google sign-in failed. Please try again.",
        oauth_server_error: "The server could not finish Google sign-in. Check that PostgreSQL is running.",
        database_unavailable: "The website database cannot be reached. Please contact the site owner.",
        google_access_denied: "Google sign-in was cancelled.",
      };
      const errorMessage =
        messages[callbackError] ||
        (callbackError.startsWith("google_token_")
          ? `Google rejected the sign-in request (${callbackError.replace("google_token_", "")}). Check the OAuth redirect URI and client settings.`
          : "Google sign-in could not be completed.");
      const errorTimer = window.setTimeout(() => setAuthError(errorMessage), 0);
      window.history.replaceState({}, "", window.location.pathname);
      if (!isMounted) window.clearTimeout(errorTimer);
    }
    apiRequest<{ user: UserProfile | null }>("/api/auth/me")
      .then((res) => {
        if (!isMounted) return;
        if (res.user) {
          setUser(res.user);
          setScreen("dashboard");
        } else {
          setScreen("login");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setScreen("login");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch expenses whenever year, month, or category changes
  const loadExpenses = useCallback(() => {
    if (!user) return;
    setExpensesLoading(true);
    const params = new URLSearchParams();
    if (selectedYear) params.set("year", selectedYear);
    if (selectedMonth && selectedMonth !== "all") params.set("month", selectedMonth);
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);

    apiRequest<{
      expenses: PersonalExpense[];
      allYears: number[];
      monthlyBreakdown: MonthBreakdown[];
      allYearsSummary: YearSummary[];
      categoryBreakdown: Array<{ category: string; totalAmount: number; count: number }>;
      yearStats: { totalAmount: number; count: number; averageMonthlyAmount: number };
    }>(`/api/personal-expenses?${params.toString()}`)
      .then((data) => {
        setExpenses(data.expenses || []);
        if (data.allYears && data.allYears.length > 0) {
          setAllYears(data.allYears);
        }
        setMonthlyBreakdown(data.monthlyBreakdown || []);
        setAllYearsSummary(data.allYearsSummary || []);
        setCategoryBreakdown(data.categoryBreakdown || []);
        setYearStats(data.yearStats || { totalAmount: 0, count: 0, averageMonthlyAmount: 0 });
      })
      .catch((err) => {
        console.error("Failed to load personal expenses:", err);
      })
      .finally(() => setExpensesLoading(false));
  }, [selectedCategory, selectedMonth, selectedYear, user]);

  useEffect(() => {
    if (user && screen === "dashboard") {
      const timer = window.setTimeout(loadExpenses, 0);
      return () => window.clearTimeout(timer);
    }
  }, [loadExpenses, screen, user]);

  // Load groups when on dashboard
  useEffect(() => {
    if (!user || screen !== "dashboard") return;
    const timer = window.setTimeout(() => {
      setGroupsLoading(true);
      apiRequest<{ groups: Array<{ id: string; name: string; member_count: number }> }>(
        "/api/groups"
      )
        .then((response) => {
          setGroups(
            response.groups.map((g) => ({
              id: g.id,
              name: g.name,
              members: g.member_count,
              total: 0,
              color: "bg-[#e9e8f7]",
            }))
          );
        })
        .catch((error: unknown) =>
          setGroupsError(error instanceof Error ? error.message : "Could not load groups.")
        )
        .finally(() => setGroupsLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [screen, user]);

  async function handlePhoneAuth() {
    setAuthLoading(true);
    setAuthError("");
    try {
      if (!window.firebase) {
        throw new Error("Phone sign-in is still loading. Please try again.");
      }
      if (!phoneConfirmation) {
        const config = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
        };
        if (!window.firebase.apps.length) window.firebase.initializeApp(config);
        const firebaseAuth = window.firebase.auth();
        const verifier = new firebaseAuth.RecaptchaVerifier(
          "phone-recaptcha",
          { size: "invisible" },
          firebaseAuth,
        );
        const confirmation = await firebaseAuth.signInWithPhoneNumber(
          `+91${phoneNumber.replace(/\D/g, "")}`,
          verifier,
        );
        setPhoneConfirmation(confirmation);
        setAuthError("");
        return;
      } else {
        const result = await phoneConfirmation.confirm(phoneCode);
        const idToken = await result.user.getIdToken();
        const res = await apiRequest<{ user: UserProfile }>("/api/auth/firebase", {
          method: "POST",
          body: JSON.stringify({ idToken }),
        });
        setUser(res.user);
        setScreen("dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setAuthError(
        message.includes("auth/api-key-not-valid")
          ? "Firebase rejected this API key. In Google Cloud, allow the Identity Toolkit API for this key, then restart the app."
          : message || "Unable to sign in. Please try again.",
      );
    } finally {
      setAuthLoading(false);
    }

  }

  function handleGoogleSignIn() {
    router.push("/api/auth/google");
  }

  async function linkGoogleAccount() {
    setAuthLoading(true);
    setLinkMessage("");
    try {
      if (!window.firebase) {
        throw new Error("Google linking is still loading. Please try again.");
      }
      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
      };
      if (!window.firebase.apps.length) window.firebase.initializeApp(config);
      const firebaseAuth = window.firebase.auth();
      if (!firebaseAuth.currentUser) {
        throw new Error("Please sign in with your phone number before linking Google.");
      }
      const provider = new window.firebase.auth.GoogleAuthProvider();
      const linked = await firebaseAuth.currentUser.linkWithPopup(provider);
      const idToken = await linked.user.getIdToken();
      const response = await apiRequest<{ user: UserProfile }>("/api/auth/firebase", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      setUser(response.user);
      setLinkMessage("Google is linked to this account.");
    } catch (error: unknown) {
      setLinkMessage(error instanceof Error ? error.message : "Could not link Google.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Logout Handler
  async function logout() {
    await apiRequest("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setShowProfile(false);
    setScreen("login");
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountNum = Number(expenseAmount);
    if (!expenseTitle.trim() || !Number.isFinite(amountNum) || amountNum <= 0) return;

    setExpenseSubmitting(true);
    try {
      await apiRequest("/api/personal-expenses", {
        method: "POST",
        body: JSON.stringify({
          title: expenseTitle.trim(),
          amount: amountNum,
          category: expenseCategory,
          expenseDate: expenseDate || today || getTodayString(),
          notes: expenseNotes.trim() || undefined,
        }),
      });

      setExpenseTitle("");
      setExpenseAmount("");
      setExpenseNotes("");
      setShowExpenseForm(false);
      loadExpenses();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Could not save expense.");
    } finally {
      setExpenseSubmitting(false);
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm("Delete this expense?")) return;
    try {
      await apiRequest(`/api/personal-expenses/${id}`, { method: "DELETE" });
      loadExpenses();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete expense.");
    }
  }

  // Create Shared Group
  async function addGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupName.trim()) return;
    try {
      const response = await apiRequest<{
        group: { id: string; name: string; member_count: number };
      }>("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: groupName.trim(), currency: "INR" }),
      });
      setGroups((current) => [
        ...current,
        {
          id: response.group.id,
          name: response.group.name,
          members: response.group.member_count,
          total: 0,
          color: "bg-[#e9e8f7]",
        },
      ]);
      setGroupName("");
    } catch (error: unknown) {
      setGroupsError(error instanceof Error ? error.message : "Could not create the group.");
    }
  }

  // Grouped expenses by date for daily ledger display
  const groupedExpenses = useMemo(() => {
    return expenses.reduce<Record<string, PersonalExpense[]>>((result, exp) => {
      (result[exp.expenseDate] ??= []).push(exp);
      return result;
    }, {});
  }, [expenses]);

  // Highest spending month detail
  const highestSpendingMonth = useMemo(() => {
    const sorted = [...monthlyBreakdown].sort((a, b) => b.totalAmount - a.totalAmount);
    return sorted[0]?.totalAmount > 0 ? sorted[0] : null;
  }, [monthlyBreakdown]);

  // Initial user avatar / initials
  const initials =
    user?.name
      ?.split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "G";

  // --- 1. SPLASH SCREEN ---
  if (screen === "splash") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--charcoal)] px-5 text-white">
        <section className="text-center">
          <div className="mx-auto flex size-24 items-center justify-center rounded-[2rem] bg-[var(--primary)] text-5xl font-extrabold shadow-[0_18px_40px_rgba(240,93,72,0.3)] animate-pulse">
            ₹
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Shreekar No Hisab</h1>
          <p className="mt-2 text-sm text-white/60">Loading your expenses and ledgers...</p>
        </section>
      </main>
    );
  }

  // --- 2. AUTHENTICATION SCREEN ---
  if (screen === "login") {
    return (
      <main className="min-h-screen bg-[var(--background)] px-5 py-10 flex items-center justify-center">
        <section className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-[var(--primary)] text-4xl font-extrabold text-white shadow-[0_14px_30px_rgba(240,93,72,0.25)]">
              ₹
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              Shreekar No Hisab
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Keep your personal and shared expenses organized.
            </p>
          </div>

          <div className="rounded-[2rem] bg-[var(--surface-card)] p-8 shadow-[0_14px_36px_rgba(75,52,45,0.07)] border border-[var(--border-subtle)]">
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--status-receive-bg)] px-3.5 py-1 text-xs font-bold text-[var(--status-receive)]">
                <span className="size-2 rounded-full bg-[var(--status-receive)] animate-ping" />
                Account access
              </span>
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--foreground)]">
                Welcome back
              </h2>
              <p className="mt-2 text-xs text-[var(--text-secondary)] leading-5">
                Sign in to continue.
              </p>
            </div>

            {authError && (
              <div role="alert" className="mb-6 rounded-2xl bg-[var(--status-owe-bg)] p-4 text-xs font-bold text-[var(--primary)] text-left">
                {authError}
              </div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-cream)] p-1">
              <button type="button" onClick={() => setAuthMethod("phone")} className={`rounded-lg py-2 text-xs font-extrabold ${authMethod === "phone" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}>Phone number</button>
              <button type="button" onClick={() => setAuthMethod("google")} className={`rounded-lg py-2 text-xs font-extrabold ${authMethod === "google" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}>Google</button>
            </div>
            {authMethod === "phone" && (
              <>
                <div className="mb-3 flex rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)]">
                  <span className="flex items-center border-r border-[var(--border-subtle)] px-3 text-sm font-bold text-[var(--text-secondary)]">+91</span>
                  <input required inputMode="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="98765 43210" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" />
                </div>
                {phoneConfirmation && <input required inputMode="numeric" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} placeholder="Enter verification code" className="mb-4 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]" />}
                <div id="phone-recaptcha" />
              </>
            )}
            <button
              disabled={authLoading}
              type="button"
              onClick={authMethod === "phone" ? handlePhoneAuth : handleGoogleSignIn}
              className="w-full rounded-full bg-[var(--primary)] py-4 px-6 text-base font-bold text-white shadow-md transition hover:bg-[var(--primary-dark)] active:scale-[0.99] disabled:opacity-60"
            >
              <svg className="hidden" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{authLoading ? "Please wait..." : authMethod === "google" ? "Continue with Google" : phoneConfirmation ? "Verify phone number" : "Send verification code"}</span>
            </button>

            <p className="mt-5 text-center text-[11px] text-[var(--text-secondary)]">Phone and Google sign-ins can use the same account when linked.</p>
          </div>
        </section>
      </main>
    );
  }

  // --- 3. MAIN DASHBOARD ---
  return (
    <main className="min-h-screen bg-[var(--background)] pb-12 text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <header className="relative flex h-20 items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-2xl font-extrabold text-white shadow-[0_8px_16px_rgba(240,93,72,0.2)]">
              ₹
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight">Shreekar No Hisab</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                <span className="size-1.5 rounded-full bg-[var(--status-receive)]" />
                Expense Tracker
              </p>
            </div>
          </div>

          {/* User profile dropdown button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfile((current) => !current)}
              aria-label="Open profile information"
              aria-expanded={showProfile}
              className="flex items-center gap-2 rounded-full bg-[var(--surface-card)] px-3 py-1.5 text-xs font-extrabold text-[var(--charcoal)] shadow-sm ring-1 ring-[var(--border-subtle)] hover:bg-[var(--surface-cream)] transition"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-[var(--primary)] text-white text-[11px] font-extrabold">
                {initials}
              </span>
              <span className="hidden sm:inline font-bold">{user?.name}</span>
              <span className="text-[10px] text-[var(--text-secondary)]">▼</span>
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 text-left shadow-[0_14px_36px_rgba(75,52,45,0.12)]">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-subtle)]">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[var(--primary)] text-white font-extrabold">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{user?.name}</p>
                    <p className="truncate text-xs text-[var(--text-secondary)]">{user?.email}</p>
                  </div>
                </div>
                <div className="py-2 text-[11px] text-[var(--text-secondary)]">
                  ✓ Signed in
                </div>
                {user?.email.endsWith("@phone.local") && (
                  <>
                    <button
                      type="button"
                      onClick={linkGoogleAccount}
                      disabled={authLoading}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] py-2 text-xs font-extrabold text-[var(--charcoal)] hover:bg-[var(--accent-yellow-light)] disabled:opacity-60"
                    >
                      {authLoading ? "Linking..." : "Link Google account"}
                    </button>
                    {linkMessage && (
                      <p role="status" className="mt-2 text-[11px] font-bold text-[var(--status-receive)]">
                        {linkMessage}
                      </p>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="mt-2 w-full rounded-xl border border-[var(--status-owe-bg)] bg-[var(--status-owe-bg)] py-2 text-xs font-extrabold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="px-5 sm:px-8">
          {/* Main Navigation Tabs */}
          <div className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1.5 shadow-sm">
            <nav aria-label="Workspace sections" className="grid grid-cols-3 gap-1">
              {[
                ["expenses", "Personal Expenses", "◫"],
                ["accounts", "Customer/Supplier Khata", "◎"],
                ["split", "Shared Splitwise", "⊕"],
              ].map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSection(value as Section)}
                  className={`rounded-xl px-2 py-3 text-center text-xs font-extrabold transition sm:text-sm ${
                    section === value
                      ? "bg-[var(--charcoal)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-cream)]"
                  }`}
                >
                  <span className="mr-1.5 text-base">{icon}</span>
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* SECTION 1: PERSONAL EXPENSES & ALL YEAR'S MONTHWISE EXPENSE */}
          {section === "expenses" && (
            <div className="space-y-6">
              {/* Year & Month Control Bar */}
              <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                    Select Year:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {allYears.map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setSelectedYear(String(yr));
                          setSelectedMonth(`${yr}-01`);
                        }}
                        className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                          selectedYear === String(yr)
                            ? "bg-[var(--primary)] text-white shadow-sm"
                            : "bg-[var(--surface-cream)] text-[var(--charcoal)] hover:bg-[var(--accent-yellow-light)]"
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenseForm((c) => !c)}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[var(--primary-dark)]"
                  >
                    + Add New Expense
                  </button>
                </div>
              </section>

              {/* Add Expense Form Modal / Inline Card */}
              {showExpenseForm && (
                <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-subtle)]">
                    <h3 className="text-base font-extrabold">Record New Expense</h3>
                    <button
                      type="button"
                      onClick={() => setShowExpenseForm(false)}
                      className="text-xs font-bold text-[var(--text-secondary)] hover:text-black"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <form onSubmit={addExpense} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                        Expense Title
                      </label>
                      <input
                        required
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        placeholder="e.g. Grocery, Lunch, Petrol"
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                        Amount (₹)
                      </label>
                      <input
                        required
                        min="1"
                        step="any"
                        type="number"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        placeholder="e.g. 350"
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                        Category
                      </label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value as Category)}
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      >
                        <option value="Food">🍜 Food</option>
                        <option value="Stationery">✏️ Stationery</option>
                        <option value="Travel">🚌 Travel</option>
                        <option value="Shopping">🛒 Shopping</option>
                        <option value="Bills">💡 Bills</option>
                        <option value="Entertainment">🍿 Entertainment</option>
                        <option value="Health">💊 Health</option>
                        <option value="Other">📦 Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                        Expense Date
                      </label>
                      <input
                        required
                        type="date"
                        value={expenseDate || today}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <input
                        value={expenseNotes}
                        onChange={(e) => setExpenseNotes(e.target.value)}
                        placeholder="Optional note / memo"
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-2 text-xs outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        disabled={expenseSubmitting}
                        type="submit"
                        className="w-full rounded-xl bg-[var(--charcoal)] py-2.5 text-xs font-extrabold text-white transition hover:bg-black"
                      >
                        {expenseSubmitting ? "Saving..." : "Save Expense"}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {/* Annual Overview & Key Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[1.5rem] bg-[var(--charcoal)] p-5 text-white shadow-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/55">
                    {selectedYear} Total Spend
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">
                    {formatMoney(yearStats.totalAmount)}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {yearStats.count} entries recorded in {selectedYear}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 border border-[var(--border-subtle)] shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                    Monthly Average
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-[var(--charcoal)]">
                    {formatMoney(yearStats.averageMonthlyAmount)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Average for the selected year</p>
                </div>

                <div className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 border border-[var(--border-subtle)] shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                    Top Spending Month
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[var(--primary)]">
                    {highestSpendingMonth
                      ? `${highestSpendingMonth.monthName} · ${formatMoney(highestSpendingMonth.totalAmount)}`
                      : "No data"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Peak expenditure period</p>
                </div>

                <div className="rounded-[1.5rem] bg-[var(--status-receive-bg)] p-5 border border-[var(--status-receive)]/20 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                    Active Filter
                  </p>
                  <p className="mt-2 text-xl font-extrabold text-[var(--status-receive)]">
                    {selectedMonth.replace(`${selectedYear}-`, "")} {selectedYear}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth(`${selectedYear}-01`);
                      setSelectedCategory("all");
                    }}
                    className="mt-1 text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    View January →
                  </button>
                </div>
              </div>

              {/* Monthly Expense Overview with Dropdown */}
              <section className="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                      Monthly Expenses
                    </span>
                    <h2 className="mt-1 text-2xl font-extrabold">
                      {selectedYear} Expense Overview
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-4 py-2.5 text-sm font-bold outline-none focus:border-[var(--primary)] cursor-pointer"
                    >
                      {monthlyBreakdown.map((m) => (
                        <option key={m.monthKey} value={m.monthKey}>
                          {m.monthName} {selectedYear}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected Month Total Display */}
                {true ? (
                  <div className="rounded-2xl bg-[var(--surface-cream)] p-5 border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                          {monthlyBreakdown.find((m) => m.monthKey === selectedMonth)?.monthName || ""} {selectedYear} Total
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-[var(--primary)]">
                          {formatMoney(
                            monthlyBreakdown.find((m) => m.monthKey === selectedMonth)?.totalAmount || 0
                          )}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {monthlyBreakdown.find((m) => m.monthKey === selectedMonth)?.count || 0} transactions
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMonth(`${selectedYear}-01`)}
                        className="rounded-xl bg-[var(--charcoal)] px-4 py-2 text-xs font-bold text-white hover:bg-black transition cursor-pointer"
                      >
                        View January
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Multi-Year Overview History */}
                {allYearsSummary.length > 1 && (
                  <div className="mt-6 pt-5 border-t border-[var(--border-subtle)]">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] mb-3">
                      Multi-Year Comparison
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {allYearsSummary.map((yrData) => (
                        <div
                          key={yrData.year}
                          onClick={() => setSelectedYear(String(yrData.year))}
                          className={`cursor-pointer rounded-xl border p-3 min-w-36 transition ${
                            selectedYear === String(yrData.year)
                              ? "border-[var(--primary)] bg-white shadow-sm"
                              : "border-[var(--border-subtle)] bg-[var(--surface-cream)]"
                          }`}
                        >
                          <span className="text-xs font-extrabold text-[var(--primary)]">
                            Year {yrData.year}
                          </span>
                          <p className="mt-1 font-extrabold text-sm">
                            {formatMoney(yrData.totalAmount)}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            {yrData.count} transactions
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Bottom Split: Daily Ledger & Category Breakdown */}
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                {/* Daily Ledger */}
                <section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 border border-[var(--border-subtle)] shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                        Daily Ledger
                      </p>
                      <h3 className="mt-0.5 text-lg font-extrabold">
                        Expenses for {monthlyBreakdown.find((m) => m.monthKey === selectedMonth)?.monthName || selectedMonth} {selectedYear}
                      </h3>
                    </div>
                    <span className="rounded-full bg-[var(--surface-cream)] px-3 py-1 text-xs font-bold">
                      {expenses.length} entries
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {expensesLoading ? (
                      <p className="py-6 text-center text-sm text-[var(--text-secondary)]">
                        Loading expenses...
                      </p>
                    ) : expenses.length === 0 ? (
                      <div className="rounded-2xl bg-[var(--surface-cream)] p-8 text-center">
                        <p className="text-base font-bold">No expenses found</p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          Click &quot;+ Add New Expense&quot; above to record your first entry.
                        </p>
                      </div>
                    ) : (
                      Object.entries(groupedExpenses).map(([dateStr, items]) => (
                        <div key={dateStr} className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-extrabold text-[var(--text-secondary)]">
                            <span>{formatDateDisplay(dateStr)}</span>
                            <span>{formatMoney(items.reduce((s, i) => s + i.amount, 0))}</span>
                          </div>
                          <div className="space-y-1.5">
                            {items.map((item) => {
                              const meta = categoryMeta[item.category] || categoryMeta.Other;
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] p-3 hover:bg-[var(--surface-cream)] transition"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span
                                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-lg ${meta.bg}`}
                                    >
                                      {meta.icon}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-extrabold">{item.title}</p>
                                      <p className="text-xs text-[var(--text-secondary)]">
                                        {item.category} {item.notes ? `· ${item.notes}` : ""}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 pl-3">
                                    <p className="text-sm font-extrabold">{formatMoney(item.amount)}</p>
                                    <button
                                      type="button"
                                      title="Delete expense"
                                      onClick={() => deleteExpense(item.id)}
                                      className="size-7 rounded-lg flex items-center justify-center text-xs text-[var(--text-secondary)] hover:bg-[var(--status-owe-bg)] hover:text-[var(--primary)] transition cursor-pointer"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Category Breakdown & Quick Actions */}
                <div className="space-y-5">
                  <section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 border border-[var(--border-subtle)] shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                      Spending by Category
                    </p>
                    <h3 className="mt-0.5 text-lg font-extrabold">Where your money went</h3>

                    <div className="mt-4 space-y-2.5">
                      {categoryBreakdown.length === 0 ? (
                        <p className="text-xs text-[var(--text-secondary)] p-3">No categories yet.</p>
                      ) : (
                        categoryBreakdown.map((cat) => {
                          const meta =
                            categoryMeta[cat.category as Category] || categoryMeta.Other;
                          const totalSpend = yearStats.totalAmount || 1;
                          const pct = Math.round((cat.totalAmount / totalSpend) * 100);
                          return (
                            <div
                              key={cat.category}
                              className="rounded-xl border border-[var(--border-subtle)] p-3"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span>{meta.icon}</span>
                                  <span className="font-extrabold">{cat.category}</span>
                                  <span className="text-[var(--text-secondary)]">
                                    ({cat.count} txns)
                                  </span>
                                </div>
                                <span className="font-extrabold">{formatMoney(cat.totalAmount)}</span>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <div className="h-1.5 flex-1 bg-[var(--surface-cream)] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[var(--primary)] rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>

                  {/* Shared group banner shortcut */}
                  <Link
                    href="/groups/room-304-boys"
                    className="block rounded-[1.5rem] bg-[var(--accent-yellow-light)] p-5 border border-[#fae2a5] hover:opacity-95 transition"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--charcoal)]/70">
                      Shared Expenses
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-[var(--charcoal)]">
                      Room 304 Boys &amp; Friends
                    </p>
                    <p className="mt-1 text-xs text-[var(--charcoal)]/70">
                      View shared groups, calculate splits &amp; balances →
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: ACCOUNTS / CUSTOMER & SUPPLIER KHATA */}
          {section === "accounts" && <AccountWorkspace />}

          {/* SECTION 3: SHARED SPLITWISE GROUPS */}
          {section === "split" && (
            <section aria-labelledby="split-heading" className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-5">
                <div className="rounded-[1.75rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_18px_40px_rgba(30,30,36,0.15)] sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">
                    Shared Groups Workspace
                  </p>
                  <h1 id="split-heading" className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">
                    Split fairly.
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    Create groups with friends or roommates, add shared expenses, and keep every settlement transparent.
                  </p>
                </div>

                <form onSubmit={addGroup} className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm border border-[var(--border-subtle)]">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                    Create New Group
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold">Who are you splitting with?</h2>
                  <div className="mt-4 flex gap-2">
                    <input
                      required
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      placeholder="e.g. Weekend trip, Flat 402"
                      className="min-w-0 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-3 text-sm outline-none focus:border-[var(--primary)]"
                    />
                    <button className="rounded-xl bg-[var(--primary)] px-5 text-sm font-extrabold text-white transition hover:bg-[var(--primary-dark)] cursor-pointer">
                      Create
                    </button>
                  </div>
                </form>
              </div>

              <div className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6 border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                      Your Groups
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold">Shared expense groups</h2>
                  </div>
                  <Link
                    href="/balances"
                    className="rounded-full bg-[var(--surface-cream)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-extrabold text-[var(--primary)] hover:bg-[var(--accent-yellow-light)] transition"
                  >
                    View Balances →
                  </Link>
                </div>

                {groupsLoading && (
                  <p className="mt-5 text-sm text-[var(--text-secondary)]">Loading your groups...</p>
                )}
                {groupsError && (
                  <p role="alert" className="mt-5 rounded-xl bg-[var(--status-owe-bg)] p-4 text-sm font-bold text-[var(--primary)]">
                    {groupsError}
                  </p>
                )}
                {!groupsLoading && !groupsError && groups.length === 0 && (
                  <p className="mt-5 rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">
                    No groups yet. Create your first group on the left.
                  </p>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/groups/room-304-boys?groupId=${group.id}`}
                      className="rounded-2xl border border-[var(--border-subtle)] p-4 hover:border-[var(--primary)] transition bg-[var(--surface-cream)]"
                    >
                      <span className={`flex size-11 items-center justify-center rounded-xl text-xl ${group.color}`}>
                        👥
                      </span>
                      <p className="mt-4 font-extrabold text-base">{group.name}</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{group.members} members</p>
                      <span className="mt-4 block text-xs font-bold text-[var(--primary)]">
                        Open group →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
