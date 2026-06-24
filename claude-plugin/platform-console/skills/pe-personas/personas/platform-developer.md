# Persona: Platform / Infrastructure Developer

## Stack & tooling
- Languages: Go, Python, Bash; HCL (Terraform)
- IaC & orchestration: Terraform, Kubernetes, Helm, Kustomize
- CI/CD: GitHub Actions / GitLab CI, ArgoCD or Flux (GitOps)
- Observability: Prometheus, Grafana, OpenTelemetry, Loki
- Cloud: AWS/GCP/Azure CLI + IAM, container registries

## Key systems to access first
1. Cloud account / org access + SSO and IAM roles
2. Kubernetes cluster access (kubeconfig, RBAC)
3. Terraform state backend + module registry
4. CI/CD pipeline credentials and secrets manager (Vault / cloud KMS)
5. On-call / paging tool (PagerDuty / Opsgenie)

## Role-specific onboarding tasks
- Provision cloud + cluster credentials and verify `kubectl get nodes` (setup, 1d)
- Clone infra monorepo, run `terraform plan` against a sandbox (systems, 1-2d)
- Deploy a sample service to the dev cluster via the golden path (projects, 2d)
- Read the platform's golden-path / paved-road docs (learning, 1d)
- Shadow an on-call rotation and review a recent incident (culture, 1d)

## Recommended resources (ranked)
1. Internal platform/golden-path handbook (docs, 10)
2. Terraform module catalog + conventions (docs, 9)
3. Kubernetes RBAC & cluster topology guide (docs, 8)
4. Incident runbooks (guide, 7)

## People to meet
- Platform lead / staff platform engineer (mentor archetype)
- SRE on-call lead
- Security engineer for IAM/secrets

## First-week goals & success metrics
- Can deploy and roll back a sample service through the paved road unaided
- Understands the GitOps flow from commit to cluster
- Has merged one small infra PR

## Ramp-time modifiers
Platform work has a steep access/permissions setup cost — add ~1-2 days to the base
timeline (junior 14d → ~15-16d) for credential provisioning and cluster familiarity.
