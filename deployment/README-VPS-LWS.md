# Déploiement KCS EduPlanner sur LWS/VPS

Le projet conserve deux cibles indépendantes.

- GitHub Pages : npm run build:github, avec /LessonPlanPowerfullyDone/.
- VPS : npm run build:vps, avec / pour kcseduplanner.kinshasachristianschool.org.

## DNS LWS

Dans la zone DNS de kinshasachristianschool.org, créer :

- Type : A
- Nom : kcseduplanner
- Valeur : adresse IPv4 publique du VPS
- TTL : valeur LWS par défaut

Ajouter un AAAA uniquement si le VPS possède une IPv6 configurée et joignable.

## Frontend VPS

Copier .env.vps.example vers .env.vps et renseigner les deux valeurs publiques Supabase. Ne jamais y placer la Service Role Key ou le mot de passe SMTP.

    npm ci
    npm run build:vps

Déployer dist dans /var/www/kcs-eduplanner/dist.

## Service mail LWS

Dans server, copier .env.example vers .env et renseigner :

- SUPABASE_SERVICE_ROLE_KEY depuis Supabase, Project Settings, API.
- L’hôte, le port et les identifiants SMTP de la boîte créée chez LWS.
- MAIL_FROM_ADDRESS, idéalement eduplanner@kinshasachristianschool.org.
- PUBLIC_LOGO_URL, qui doit rester publiquement accessible.

Installation :

    cd /var/www/kcs-eduplanner/server
    npm ci --omit=dev
    sudo cp ../deployment/kcs-eduplanner-mail.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable --now kcs-eduplanner-mail
    sudo systemctl status kcs-eduplanner-mail

Test local :

    curl http://127.0.0.1:3001/api/health

## Nginx et HTTPS

    sudo cp deployment/nginx-kcseduplanner.conf /etc/nginx/sites-available/kcseduplanner
    sudo ln -s /etc/nginx/sites-available/kcseduplanner /etc/nginx/sites-enabled/kcseduplanner
    sudo nginx -t
    sudo systemctl reload nginx
    sudo certbot --nginx -d kcseduplanner.kinshasachristianschool.org

## Supabase

Dans Authentication, URL Configuration :

- Site URL : https://kcseduplanner.kinshasachristianschool.org
- Redirect URL : https://kcseduplanner.kinshasachristianschool.org/#/login
- Conserver aussi l’URL GitHub Pages dans les redirections autorisées.

Le service génère le lien avec Supabase Admin puis envoie l’email par SMTP LWS. La Service Role Key et le mot de passe SMTP restent exclusivement sur le VPS.

## Test réel

1. Ouvrir la page de connexion du sous-domaine.
2. Demander une récupération pour un compte actif.
3. Vérifier l’en-tête KCS, le filigrane, le bouton et le dossier spam.
4. Ouvrir le lien dans une fenêtre privée.
5. Choisir un nouveau mot de passe et se reconnecter.
6. Exécuter aussi npm run build:github et vérifier le GitHub Pages existant.