import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarDays, FileText, Languages, Moon, Plus, Search, Sun } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useLessons } from "../hooks/useLessons";
import { Button } from "../components/ui/button";
import { schoolDisplayName } from "../data/defaults";

export const AppLayout = () => {
  const { dark, toggleDark, language, setLanguage, imageUrl } = useApp();
  const { createLesson } = useLessons();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-foreground">
      <header className="sticky top-3 z-30 mx-3 mt-3 rounded-lg glass">
        <div className="mx-auto flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <NavLink to="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-cyan-300/25 bg-white/95 p-1 shadow-[0_0_28px_rgba(20,184,222,0.18)]">
              <img src={imageUrl} alt="KCS identity" className="h-full w-full rounded-sm object-cover" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black uppercase text-cyan-200">EduPay KCS</p>
              <p className="truncate text-base font-black text-white">{schoolDisplayName} Lesson Planner</p>
            </div>
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-bold ${isActive ? "border border-cyan-300/25 bg-cyan-500/15 text-cyan-100" : "text-muted-foreground hover:bg-white/10 hover:text-white"}`}>
              Dashboard
            </NavLink>
            <NavLink to="/plans" className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-bold ${isActive ? "border border-cyan-300/25 bg-cyan-500/15 text-cyan-100" : "text-muted-foreground hover:bg-white/10 hover:text-white"}`}>
              Plans
            </NavLink>
          </nav>
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="outline" className="hidden sm:inline-flex" onClick={() => navigate("/plans?focus=search")}>
              <Search size={17} /> Search
            </Button>
            <Button
              className="px-3 sm:px-4"
              onClick={() => {
                const lesson = createLesson();
                navigate(`/editor/${lesson.id}`);
              }}
            >
              <Plus size={17} /> <span className="hidden sm:inline">New Lesson Plan</span>
            </Button>
            <Button variant="ghost" onClick={() => setLanguage(language === "en" ? "fr" : "en")} aria-label="Toggle language">
              <Languages size={18} />
            </Button>
            <Button variant="ghost" onClick={toggleDark} aria-label="Toggle theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 px-3 py-4 sm:px-5 lg:px-6 xl:px-8">
        <Outlet />
      </main>
      <footer className="mx-3 mb-3 flex items-center justify-between rounded-lg glass px-4 py-3 text-xs text-muted-foreground lg:px-6">
        <span className="flex items-center gap-2"><FileText size={14} /> KCS Lesson Planner</span>
        <span className="flex items-center gap-1">
          <CalendarDays size={14} /> A4 print-ready
        </span>
      </footer>
    </div>
  );
};
