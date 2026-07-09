import { FormEvent, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
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
      setError("Email ou mot de passe incorrect.");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8 text-foreground">
      <Card className="w-full max-w-md p-6 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md border border-primary/20 bg-white/90 p-1 shadow-sm">
            <img src={schoolImage} alt="KCS" className="h-full w-full rounded-sm object-cover" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-primary">EduPlanner KCS</p>
            <h1 className="truncate text-2xl font-black text-white">Connexion</h1>
            <p className="text-sm text-muted-foreground">{schoolDisplayName}</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1">
            <Label>Compte utilisateur</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <Select className="pl-9" value={email} onChange={(event) => setEmail(event.target.value)}>
                {activeUsers.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.name} - {roleLabels[user.role]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Mot de passe</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <Input className="pl-9" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Mode local temporaire : mot de passe démo {mockAuthService.demoPassword}</p>
          </div>

          {selectedUser && (
            <div className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm">
              <p className="flex items-center gap-2 font-bold text-foreground"><ShieldCheck size={16} /> {roleLabels[selectedUser.role]}</p>
              <p className="mt-1 text-muted-foreground">
                {selectedUser.department} · {selectedUser.subjects.length ? selectedUser.subjects.join(", ") : "Accès institutionnel"}
              </p>
            </div>
          )}

          {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive">{error}</p>}

          <Button className="w-full" type="submit">Se connecter</Button>
        </form>
      </Card>
    </main>
  );
};
