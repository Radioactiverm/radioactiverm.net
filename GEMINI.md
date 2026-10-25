# Guidelines & Deployment

## Development Rules
- Do not add comments to any code, config, or markup files (`//`, `/* */`, `<!-- -->`, `#`).
- Keep `README.md` minimal (one-sentence description, tech stack, getting started commands).
- Verify the build with `npm run build` before pushing.

## Commit and Push
From the project root:

```bash
npm run build
git add .
git commit -m "your commit message"
git push origin main
```

## Server Reload and Deployment
Server details:
- Host: `192.168.1.9`
- User: `root`
- Path: `/var/www/radioactiverm.net`
- Web server: `caddy`

### Deploy via SSH
Connect to the server and pull latest changes:

```bash
ssh root@192.168.1.9
cd /var/www/radioactiverm.net
git pull origin main
npm run build
chown -R caddy:caddy /var/www/radioactiverm.net
systemctl restart caddy
```

### Single Command Deploy
Run directly from your local terminal:

```bash
ssh root@192.168.1.9 "cd /var/www/radioactiverm.net && git pull origin main && npm run build && chown -R caddy:caddy /var/www/radioactiverm.net && systemctl restart caddy"
```

## Music Sync Commands
To sync music from YouTube Music playlist on the server:

```bash
cd /var/www/radioactiverm.net
npm run sync-yt
npm run build
chown -R caddy:caddy /var/www/radioactiverm.net
systemctl restart caddy
```
