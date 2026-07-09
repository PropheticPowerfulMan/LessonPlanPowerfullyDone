import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarDays, FileText, Languages, LogOut, Moon, Plus, Search, Sun, UserRound } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useLessons } from "../hooks/useLessons";
import { Button } from "../components/ui/button";
import { useToast } from "../components/Toast";
import { schoolDisplayName } from "../data/defaults";
import { roleLabels } from "../types/user";

export const AppLayout = () => {
  const { dark, toggleDark, language, setLanguage, imageUrl } = useApp();
  const { currentUser, signOut, can } = useAuth();
  const { createLesson } = useLessons();
  const { notify } = useToast();
  const navigate = useNavigate();
  const canCreateLessons = can("lesson:create");
  if (!currentUser) return null;
  const toggleLanguage = () => {
    const next = language === "en" ? "fr" : "en";
    setLanguage(next);
    notify(next === "fr" ? "Langue changée : Français" : "Language changed: English");
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-foreground">
      <header className="sticky top-2 z-30 mx-2 mt-2 rounded-lg glass sm:top-3 sm:mx-3 sm:mt-3">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:flex-nowrap lg:px-6">
          <NavLink to="/" className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-cyan-300/25 bg-white/95 p-1 shadow-[0_0_28px_rgba(20,184,222,0.18)]">
              <img src={imageUrl} alt="KCS identity" className="h-full w-full rounded-sm object-cover" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black uppercase text-cyan-200">EduPlanner KCS</p>
              <p className="truncate text-sm font-black text-white sm:text-base">{schoolDisplayName} Lesson Planner</p>
            </div>
          </NavLink>
          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto md:order-none md:w-auto">
            <NavLink to="/" className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-bold ${isActive ? "border border-primary/30 bg-primary/15 text-foreground dark:border-cyan-300/25 dark:bg-cyan-500/15 dark:text-cyan-100" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white"}`}>
              Dashboard
            </NavLink>
            <NavLink to="/plans" className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-bold ${isActive ? "border border-primary/30 bg-primary/15 text-foreground dark:border-cyan-300/25 dark:bg-cyan-500/15 dark:text-cyan-100" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white"}`}>
              Plans
            </NavLink>
          </nav>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <div className="order-4 flex w-full min-w-0 items-center gap-2 rounded-md border border-border bg-card/90 px-3 py-2 shadow-sm dark:bg-[#061520]/90 sm:w-auto sm:min-w-[240px] lg:order-none">
              <UserRound size={16} className="shrink-0 text-cyan-200" />
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-foreground">{currentUser.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{roleLabels[currentUser.role]}</p>
              </div>
            </div>
            <Button variant="outline" className="hidden sm:inline-flex" onClick={() => navigate("/plans?focus=search")}>
              <Search size={17} /> Search
            </Button>
            {canCreateLessons && (
              <Button
                className="px-3 sm:px-4"
                onClick={() => {
                  const lesson = createLesson();
                  navigate(`/editor/${lesson.id}`);
                }}
              >
                <Plus size={17} /> <span className="hidden sm:inline">New Lesson Plan</span>
              </Button>
            )}
            <Button variant="ghost" onClick={toggleLanguage} aria-label="Toggle language" title={language === "en" ? "Switch to French" : "Passer en anglais"}>
              <Languages size={18} />
              <span className="text-xs font-black uppercase">{language === "en" ? "FR" : "EN"}</span>
            </Button>
            <Button variant="ghost" onClick={toggleDark} aria-label="Toggle theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button variant="ghost" onClick={() => { signOut(); navigate("/login", { replace: true }); }} aria-label="Logout">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>
      <main className="min-w-0 flex-1 px-2 py-4 sm:px-5 lg:px-6 xl:px-8">
        <Outlet />
      </main>
      <footer className="mx-2 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg glass px-3 py-3 text-xs text-muted-foreground sm:mx-3 sm:mb-3 sm:px-4 lg:px-6">
        <span className="flex items-center gap-2"><FileText size={14} /> KCS Lesson Planner</span>
        <span className="hidden sm:inline">{currentUser.name} - {roleLabels[currentUser.role]}</span>
        <span className="flex items-center gap-1">
          <CalendarDays size={14} /> A4 print-ready
        </span>
      </footer>
    </div>
  );
};
