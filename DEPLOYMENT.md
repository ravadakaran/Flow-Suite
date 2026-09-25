# FlowSuite Deployment Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Environment variables configured (see below)

### Single-Command Startup

```bash
# Development (local development with hot reload)
docker-compose up -d

# Production (optimized for deployment)
docker-compose -f docker-compose.prod.yml up -d
```

### Verify All Services

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## Environment Configuration

### Create `.env` File

Copy and customize the template below. All variables are required for production.

```bash
# Database
POSTGRES_USER=flowsuite
POSTGRES_PASSWORD=<generate-secure-password>
POSTGRES_DB=flowsuite
POSTGRES_PORT=5433

# Redis
REDIS_PORT=6379

# Backend
NODE_ENV=production
JWT_ACCESS_SECRET=<generate-random-secret-min-32-chars>
JWT_REFRESH_SECRET=<generate-random-secret-min-32-chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_<your-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-secret>

# Frontend
FRONTEND_URL=http://localhost:5173  # or your domain
FRONTEND_PORT=80

# Backend
BACKEND_PORT=3000

# pgAdmin
PGADMIN_EMAIL=admin@flowsuite.dev
PGADMIN_PASSWORD=<generate-secure-password>
PGADMIN_PORT=5050
```

### Generate Secure Secrets

```bash
# Generate JWT secrets (32+ character random strings)
openssl rand -base64 32

# Or use this Python snippet
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Docker Compose Files

### Development (`docker-compose.yml`)
- PostgreSQL, Redis, pgAdmin (infrastructure only)
- Node.js dev servers for hot reload
- Use for local development

### Production (`docker-compose.prod.yml`)
- Complete stack: PostgreSQL, Redis, pgAdmin, Backend, Frontend
- Production-optimized builds
- Health checks for all services
- Automatic restarts

---

## Services & Ports

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| **Backend (NestJS)** | 3000 | REST API & Swagger docs | GET /api/docs |
| **Frontend (React)** | 80 | SPA web application | GET / |
| **PostgreSQL** | 5433 | Main database | `pg_isready` |
| **Redis** | 6379 | Cache & job queue | `redis-cli ping` |
| **pgAdmin** | 5050 | Database UI | HTTP GET |

---

## Common Tasks

### View Database
```bash
# Open pgAdmin
# URL: http://localhost:5050
# Email: admin@flowsuite.dev
# Password: <PGADMIN_PASSWORD>

# Or use CLI
docker-compose exec postgres psql -U flowsuite flowsuite
```

### Run Migrations
```bash
# Migrations run automatically on backend startup
# If manual migration needed:
docker-compose exec backend npm run prisma:migrate
```

### Seed Database
```bash
# Seed test data
docker-compose exec backend npm run prisma:seed
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Health Status
```bash
# Check all health checks
docker-compose ps

# Verbose health check details
docker-compose exec backend curl http://localhost:3000/api/docs
docker-compose exec frontend curl http://localhost/
```

### Stop Services
```bash
# Stop all (keep data)
docker-compose down

# Stop and remove volumes (DELETES DATA)
docker-compose down -v
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Generate secure JWT secrets
- [ ] Set strong PostgreSQL password
- [ ] Configure STRIPE_SECRET_KEY and webhook secret
- [ ] Set FRONTEND_URL to your domain
- [ ] Update NODE_ENV to `production`
- [ ] Review all environment variables in `.env`

### On First Startup
- [ ] Database migrations run automatically
- [ ] Seed data created with test credentials (if needed)
- [ ] Backend health check passes (3000/api/docs)
- [ ] Frontend loads without CORS errors (port 80)
- [ ] All containers show "Up" status

### Post-Deployment
- [ ] Test login with credentials
- [ ] Create a test project
- [ ] Create a test task with drag-and-drop
- [ ] Verify API documentation at `/api/docs`
- [ ] Check SSL/TLS certificate (if applicable)
- [ ] Monitor logs for errors

---

## Cloud Deployment Scenarios

### AWS EC2
```bash
# 1. SSH into instance
ssh -i key.pem ec2-user@<instance-ip>

# 2. Install Docker
sudo yum update && sudo yum install docker

# 3. Clone repository
git clone <repo-url>
cd FlowSuite

# 4. Configure environment
cp .env.example .env
# Edit .env with secure values

# 5. Start services
docker-compose -f docker-compose.prod.yml up -d

# 6. Configure reverse proxy (nginx)
# See "SSL/TLS Configuration" below
```

### DigitalOcean App Platform
```bash
# docker-compose.prod.yml is auto-detected
# Set environment variables in App Platform UI
# Configure domain and SSL automatically
```

### Heroku (via container registry)
```bash
heroku login
heroku container:login
docker tag flowsuite-backend:latest registry.heroku.com/app-name/backend
docker push registry.heroku.com/app-name/backend
```

---

## SSL/TLS Configuration

### With Let's Encrypt + Nginx

```nginx
# /etc/nginx/sites-available/flowsuite
server {
    listen 443 ssl http2;
    server_name flowsuite.example.com;

    ssl_certificate /etc/letsencrypt/live/flowsuite.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flowsuite.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name flowsuite.example.com;
    return 301 https://$server_name$request_uri;
}
```

Install certificate:
```bash
sudo certbot certonly --standalone -d flowsuite.example.com
```

---

## Backup & Restore

### Backup PostgreSQL
```bash
# Backup to file
docker-compose exec postgres pg_dump -U flowsuite flowsuite > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U flowsuite flowsuite < backup.sql
```

### Backup Volumes
```bash
# Backup all Docker volumes
docker run --rm \
  -v flowsuite_postgres_data:/data \
  -v $(pwd):/backup \
  busybox tar czf /backup/postgres-backup.tar.gz /data

# Restore
docker run --rm \
  -v flowsuite_postgres_data:/data \
  -v $(pwd):/backup \
  busybox tar xzf /backup/postgres-backup.tar.gz -C /data
```

---

## Troubleshooting

### Container fails to start
```bash
# View logs
docker-compose logs backend

# Common issues:
# - Port already in use: change POSTGRES_PORT or BACKEND_PORT in .env
# - Permission denied: use sudo or add user to docker group
# - Out of memory: increase Docker memory limit
```

### Database connection errors
```bash
# Check PostgreSQL is running and healthy
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U flowsuite -c "SELECT 1"

# Check DATABASE_URL format
echo $DATABASE_URL
```

### Frontend shows "Cannot reach backend"
```bash
# Verify backend is running
docker-compose logs -f backend | grep "listening"

# Check FRONTEND_URL and CORS settings
# Frontend should use relative /api path (proxy via Nginx)
```

### Migrations not running
```bash
# Check backend logs
docker-compose logs backend | grep -i prisma

# Run manually
docker-compose exec backend npm run prisma:migrate

# Seed if needed
docker-compose exec backend npm run prisma:seed
```

---

## Monitoring & Logging

### Real-time Logs
```bash
# All services
docker-compose logs -f --tail=50

# Specific service
docker-compose logs -f backend
```

### Log Aggregation (Optional)
```bash
# With ELK Stack or Datadog
# Modify docker-compose.prod.yml to forward logs
# See Docker logging documentation
```

### Resource Usage
```bash
docker stats
```

---

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` to git
   - Use `.env.example` as template
   - Rotate secrets regularly

2. **Database**
   - Change default POSTGRES_PASSWORD
   - Use strong pgAdmin password
   - Regular backups

3. **JWT Secrets**
   - Generate with `openssl rand -base64 32`
   - Store in secrets manager (AWS Secrets Manager, HashiCorp Vault)
   - Rotate quarterly

4. **Network**
   - Use HTTPS/TLS in production
   - Enable firewall rules
   - Use VPC / private networks

5. **Docker**
   - Use specific image versions (not `latest`)
   - Scan images for vulnerabilities
   - Run containers as non-root user

6. **Monitoring**
   - Monitor disk space (PostgreSQL growth)
   - Set up alerts for failed health checks
   - Track API error rates

---

## Support

For issues or questions:
- Check logs: `docker-compose logs [service]`
- Review `.env` configuration
- Verify all services are healthy: `docker-compose ps`
- Check health endpoints manually

