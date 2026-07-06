import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, Languages, Moon, Plus, Search, Sun } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useLessons } from "../hooks/useLessons";
import { Button } from "../components/ui/button";

export const AppLayout = () => {
  const { dark, toggleDark, language, setLanguage, imageUrl } = useApp();
  const { createLesson } = useLessons();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="flex min-w-0 items-center gap-3">
            <img src={imageUrl} alt="School identity" className="h-11 w-11 rounded-lg object-cover shadow-md" />
            <div className="min-w-0">
              <p className="truncate text-base font-black">Powerful Lesson Planner</p>
              <p className="truncate text-xs text-muted-foreground">Professional planning for every subject</p>
            </div>
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-muted" : "hover:bg-muted"}`}>
              Dashboard
            </NavLink>
            <NavLink to="/plans" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-muted" : "hover:bg-muted"}`}>
              Plans
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden sm:inline-flex" onClick={() => navigate("/plans?focus=search")}>
              <Search size={17} /> Search
            </Button>
            <Button
              onClick={() => {
                const lesson = createLesson();
                navigate(`/editor/${lesson.id}`);
              }}
            >
              <Plus size={17} /> New Lesson Plan
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
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto flex max-w-7xl items-center justify-between px-4 py-8 text-xs text-muted-foreground">
        <span>Powerful Lesson Planner</span>
        <span className="flex items-center gap-1">
          <CalendarDays size={14} /> A4 print-ready
        </span>
      </footer>
    </div>
  );
};
