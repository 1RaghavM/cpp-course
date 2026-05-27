# T03: Judge0 Infrastructure

## Wave: 0 (independent — no dependencies)

## Objective

Create the Docker Compose and Fly.io deployment configuration for Judge0 with gVisor runtime. This is pure infrastructure config — no application code. The Judge0 VM is the only piece that runs outside Vercel.

## Files to create

```
infra/judge0/docker-compose.yml
infra/judge0/deploy.fly.toml
```

## docker-compose.yml

Three services: Judge0 server, Judge0 workers, Postgres, Redis.

```yaml
services:
  server:
    image: judge0/judge0:1.13.1          # pinned, post-CVE-2024-29021
    restart: always
    privileged: false
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    user: "1000:1000"
    runtime: runsc                       # gVisor
    environment:
      - REDIS_HOST=redis
      - POSTGRES_HOST=db
      - JUDGE0_AUTHN_HEADER=X-Auth-Token
      - JUDGE0_AUTHN_TOKEN=${JUDGE0_TOKEN}
      - ENABLE_NETWORK=false
      - MAX_CPU_TIME_LIMIT=5
      - MAX_MEMORY_LIMIT=256000          # 256 MB in KB
      - MAX_FILE_SIZE=100                # 100 KB stdout
      - MAX_PROCESSES_AND_OR_THREADS=64
    ports:
      - "2358:2358"
    networks: [judge0]
    depends_on: [db, redis]

  workers:
    image: judge0/judge0:1.13.1
    command: ["./scripts/workers"]
    restart: always
    privileged: false
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    user: "1000:1000"
    runtime: runsc
    environment:
      - REDIS_HOST=redis
      - POSTGRES_HOST=db
      - ENABLE_NETWORK=false
      - MAX_CPU_TIME_LIMIT=5
      - MAX_MEMORY_LIMIT=256000
      - MAX_FILE_SIZE=100
      - MAX_PROCESSES_AND_OR_THREADS=64
    networks: [judge0]
    depends_on: [db, redis]

  db:
    image: postgres:16
    restart: always
    environment:
      - POSTGRES_DB=judge0
      - POSTGRES_USER=judge0
      - POSTGRES_PASSWORD=${JUDGE0_DB_PASSWORD}
    volumes:
      - judge0-db:/var/lib/postgresql/data
    networks: [judge0]

  redis:
    image: redis:7
    restart: always
    networks: [judge0]

volumes:
  judge0-db:

networks:
  judge0:
```

### Critical security constraints

Every item below is a P0 requirement from the security spec:

- Judge0 version pinned to >= 1.13.1 (CVE-2024-29021 patch)
- Container runtime: `runsc` (gVisor), NOT default runc
- NOT `--privileged`
- `no-new-privileges` security option
- `ENABLE_NETWORK=false` — no outbound network from sandbox
- Read-only root filesystem, only /tmp writable
- Non-root user (uid 1000)
- CPU time limit: 5s
- Memory limit: 256MB
- Process limit: 64 pids
- Auth token required via `X-Auth-Token` header

## deploy.fly.toml

Fly.io machine configuration for a `shared-cpu-1x` ($5/mo) instance:

```toml
app = "cpproad-judge0"
primary_region = "ewr"             # US East, close to Vercel

[build]
  dockerfile = "Dockerfile"        # or use docker-compose via flyctl

[http_service]
  internal_port = 2358
  force_https = true
  auto_stop_machines = false       # always-on for low latency
  auto_start_machines = true

[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"

[checks]
  [checks.health]
    type = "http"
    port = 2358
    path = "/health"
    interval = "30s"
    timeout = "5s"
```

## Skills to reference

- `/project:security-verify` — Part 1 (Judge0 Sandbox): every item in that checklist maps to a config setting in this file. Run the full checklist after deploying.

## Acceptance criteria

- [ ] `docker-compose up` starts all 4 services without errors
- [ ] `curl -H "X-Auth-Token: $TOKEN" http://localhost:2358/health` returns 200
- [ ] Request without auth token returns 401
- [ ] A simple C++ submission compiles and returns output
- [ ] `docker inspect` confirms runtime is `runsc`
- [ ] All security constraints from the checklist above are met
- [ ] `fly deploy` deploys to Fly.io successfully
