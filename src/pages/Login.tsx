import { FormEvent, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input, Select } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { schoolDisplayName, schoolImage } from "../data/defaults";
import { mockAuthService } from "../services/mockAuthService";
import { roleLabels } from "../types/user";

export const Login = () => {
  const { currentUser, users, signIn } = useAuth();
  const navigate = useNavigate();
  const activeUsers = useMemo(() => users.filter((user) => user.status === "active"), [users]);
  const [email, setEmail] = useState(activeUsers[0]?.email || "");
  const [password, setPassword] = useState(mockAuthService.demoPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (currentUser) return <Navigate to="/" replace />;

  const selectedUser = activeUsers.find((user) => user.email === email);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      signIn(email, password);
      navigate("/", { replace: true });
    } catch {
      setError("Incorrect email or password.");
    }
  };

  return (
    <main className="theme-dark-panel grid min-h-screen place-items-center overflow-hidden bg-[#030d14] px-4 py-8 text-[#e7faff]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,222,0.20),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_30%),linear-gradient(180deg,#031b34_0%,#04141f_42%,#030d14_100%)]" />
      <Card className="relative w-full max-w-lg overflow-hidden border-cyan-300/20 bg-[#071824]/95 p-0 text-[#e7faff]">
        <div className="border-b border-cyan-300/20 bg-slate-950 px-6 py-5 text-white sm:px-7">
          <div className="flex items-center gap-3">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-md border border-cyan-200/40 bg-white p-1 shadow-sm">
              <img src={schoolImage} alt="KCS" className="h-full w-full rounded-sm object-cover" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-cyan-200">EduPlanner KCS</p>
              <h1 className="truncate text-3xl font-black text-white">Login</h1>
              <p className="text-sm text-slate-300">{schoolDisplayName}</p>
            </div>
          </div>
          <p className="mt-4 rounded-md border border-cyan-300/20 bg-white/[0.06] px-3 py-2 text-sm text-cyan-50">
            Individual access for teachers, HODs, and school authorities.
          </p>
        </div>

        <form className="space-y-4 p-6 sm:p-7" onSubmit={submit}>
          <div className="space-y-1">
            <Label className="text-cyan-50">User account</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-sm bg-cyan-300/10 text-[#9cecff] shadow-[0_0_12px_rgba(156,236,255,0.22)]">
                <Mail size={16} strokeWidth={2.5} />
              </span>
              <Select className="border-cyan-300/20 bg-[#030d14]/85 pl-10 text-cyan-50" value={email} onChange={(event) => setEmail(event.target.value)}>
                {activeUsers.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.name} - {roleLabels[user.role]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-cyan-50">Password</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-sm bg-cyan-300/10 text-[#9cecff] shadow-[0_0_12px_rgba(156,236,255,0.22)]">
                <LockKeyhole size={16} strokeWidth={2.5} />
              </span>
              <Input className="border-cyan-300/20 bg-[#030d14]/85 pl-10 pr-11 text-cyan-50" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} />
              <button
                type="button"
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-cyan-200 hover:bg-cyan-500/15 hover:text-white"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <p className="text-xs text-cyan-100/80">Temporary local mode: demo password {mockAuthService.demoPassword}</p>
          </div>

          {selectedUser && (
            <div className="rounded-md border border-cyan-300/20 bg-cyan-500/10 px-3 py-3 text-sm">
              <p className="flex items-center gap-2 font-bold text-cyan-50"><ShieldCheck size={16} /> {roleLabels[selectedUser.role]}</p>
              <p className="mt-1 text-cyan-100/80">
                {selectedUser.department} - {selectedUser.subjects.length ? selectedUser.subjects.join(", ") : "Institutional access"}
              </p>
            </div>
          )}

          {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive">{error}</p>}

          <Button className="w-full" type="submit"><UserRoundCheck size={18} /> Sign in</Button>
        </form>
      </Card>
    </main>
  );
};
