# Deploying to the Oracle Cloud VM

One-time manual setup. After this, every push to `main` auto-deploys via `.github/workflows/cd.yml`.

## 1. Create the VM

1. Sign up for Oracle Cloud ("Always Free" tier) at https://www.oracle.com/cloud/free/, or use your
   existing account -- this should be your **second** free VM (StravaClone already uses the first).
2. Create a Compute instance:
   - Shape: **VM.Standard.E2.1.Micro** (AMD, x86/amd64) -- the Ampere A1 (ARM) shape is also
     Always Free, but frequently has no available capacity ("Out of capacity" errors); E2.1.Micro
     doesn't have that problem. Images are built as `linux/amd64` to match.
   - Image: Ubuntu 24.04 (or latest LTS).
   - Generate/upload an SSH key pair when prompted -- save the private key, you'll need it both
     to log in and as a GitHub Actions secret.
   - CoffeeExplorer has no OSRM/routing service, so RAM is much less of a concern here than on the
     StravaClone VM -- Postgres + backend + frontend + nginx comfortably fits E2.1.Micro's 1GB RAM.
3. In the VM's assigned **Virtual Cloud Network -> Security List**, add ingress rules allowing
   TCP ports **80** and **443** from `0.0.0.0/0` (port 22/SSH is usually already open by default).
   443 isn't used yet (see "About TLS" below), but opening it now saves a step later.
4. Note the instance's public IP.

## 2. Initial server setup

SSH in using the VM's **public IP** (`ssh ubuntu@<vm-ip>`). Then:

```sh
# Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### Give the VM access to this (private) repo

Generate a deploy key so the VM can `git clone`/`git pull` without your personal credentials:

```sh
ssh-keygen -t ed25519 -C "coffeeexplorer-vm-deploy" -f ~/.ssh/coffeeexplorer_deploy -N ""
cat ~/.ssh/coffeeexplorer_deploy.pub
```

Add the printed public key at **github.com/LouisBarbonet/CoffeeExplorer -> Settings -> Deploy keys
-> Add deploy key** (read-only is enough). Then, still on the VM:

```sh
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/coffeeexplorer_deploy
EOF

git clone git@github.com:LouisBarbonet/CoffeeExplorer.git ~/coffeeexplorer
```

### Give the VM pull access to the container images

Simplest option: make the two GHCR packages public once they exist after the first CI run
(**github.com/LouisBarbonet?tab=packages -> each package -> Package settings -> Change visibility
-> Public**). They're just built app code, not meaningfully more sensitive than the already-private
source repo.

If you'd rather keep them private, log the VM into GHCR instead with a
[PAT](https://github.com/settings/tokens) scoped to `read:packages`:

```sh
echo "<PAT>" | docker login ghcr.io -u LouisBarbonet --password-stdin
```

## 3. Configure the environment

```sh
cd ~/coffeeexplorer
cp .env.example .env
```

Edit `.env` with **real, freshly-generated** production values (do not reuse the dev secrets from
your laptop -- those are only meant for local `docker compose --profile container up` testing):

- `POSTGRES_PASSWORD` -- a strong random password (this VM's Postgres volume is brand new, so
  unlike local dev there's no already-initialized password to stay consistent with)
- `JWT_SECRET` / `JWT_REFRESH_SECRET` -- generate with `openssl rand -hex 32` (run twice, once per secret)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` -- your real login for this deployment
- `GHCR_OWNER=louisbarbonet`
- Leave `DOMAIN` at its placeholder and `COOKIE_SECURE=false` until you set up TLS -- see "About TLS" below.

## 4. First manual deploy

```sh
cd ~/coffeeexplorer
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env exec backend npx prisma migrate deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env exec backend node dist/prisma/seed.js
# nginx caches the backend/frontend containers' IPs at its own startup; restart
# it whenever only those two got recreated, or you'll get 502s until you do.
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env restart nginx
```

> Note: pulling images requires at least one successful CI run on `main` to have published them
> to GHCR first (push any commit, or re-run the `cd.yml` workflow, before this step).

Visit `http://<vm-ip>` -- you should see the login page.

## 5. Wire up automatic deploys

Add these as GitHub Actions secrets (repo **Settings -> Secrets and variables -> Actions**, or via
`gh secret set <NAME>` from your own machine):

| Secret | Value |
|---|---|
| `ORACLE_VM_HOST` | the VM's public IP |
| `ORACLE_VM_USER` | `ubuntu` (or whatever user you SSH in as) |
| `ORACLE_VM_SSH_KEY` | the **private** key that can SSH into the VM (not the deploy key from step 2 -- a key for logging in as yourself) |

From then on, every push to `main` runs checks, builds+pushes amd64 images to GHCR, then SSHes
in and runs the same `pull` / `up -d` / `migrate deploy` sequence from step 4 automatically.

## About TLS

**Not set up yet** -- this deployment currently serves plain HTTP only (no domain). Without HTTPS,
`COOKIE_SECURE` must stay `false` (browsers silently drop "secure" cookies over plain HTTP, which
would otherwise break login).

Once you have a domain, this project's TLS setup mirrors StravaClone's exactly: put the domain
behind **Cloudflare** (proxied/orange-cloud DNS) in front of the VM, and use a **Cloudflare Origin
CA certificate** rather than Let's Encrypt -- Cloudflare terminates the publicly-trusted HTTPS
connection for real browsers at its own edge, and only Cloudflare's edge ever talks to this VM
directly, so the origin only needs a cert *Cloudflare* trusts, not one the public trusts. That cert
is free, lasts up to 15 years, and needs no renewal automation, unlike Let's Encrypt.

1. In the Cloudflare dashboard for the domain, under **SSL/TLS**, set the encryption mode to
   **Full (strict)**.
2. Still in Cloudflare, go to **SSL/TLS -> Origin Server -> Create Certificate**. Keep the default
   private key type (RSA), list both `<your-domain>` and `*.<your-domain>` as hostnames, and use the
   max validity (15 years). Cloudflare shows the cert and private key once -- copy both.
3. On the VM:
   ```sh
   sudo mkdir -p /etc/coffeeexplorer/certs
   sudo nano /etc/coffeeexplorer/certs/origin.pem   # paste the certificate
   sudo nano /etc/coffeeexplorer/certs/origin.key   # paste the private key
   sudo chmod 600 /etc/coffeeexplorer/certs/origin.key
   ```
4. Add an HTTPS server block to `docker-compose.prod.yml`'s nginx service (a `templates-ssl/`
   directory with a cert-aware `default.conf.template`, mounted in place of the current
   `nginx/templates/`, plus the certs volume and port 443 -- see StravaClone's
   `infra/nginx/templates-ssl/default.conf.template` for the exact shape to copy).
5. In `.env` on the VM, set `DOMAIN=<your-domain>` and `COOKIE_SECURE=true`, then redeploy.
6. Verify from a browser: `https://<your-domain>` should load with a valid padlock (Cloudflare's
   edge cert, not the origin one -- visitors never see the origin cert directly).

Nothing to renew for ~15 years. If you ever move away from Cloudflare's proxy, this setup would
need to switch to Let's Encrypt instead, since the origin would then be publicly reachable and need
a cert browsers themselves trust.
