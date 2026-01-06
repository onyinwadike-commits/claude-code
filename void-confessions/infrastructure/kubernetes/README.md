# Void Confessions - Kubernetes Infrastructure

This directory contains Kubernetes manifests for deploying the Void Confessions application.

## Directory Structure

```
kubernetes/
├── base/                    # Namespace, RBAC, Network Policies
│   ├── namespace.yaml       # Namespace with quotas and limits
│   └── rbac.yaml           # Service accounts and roles
├── configmaps/             # Non-sensitive configuration
│   └── configmaps.yaml     # All ConfigMaps
├── secrets/                # Sensitive configuration templates
│   ├── secrets.yaml        # Secret templates (DO NOT COMMIT WITH REAL VALUES)
│   └── sealed-secrets-example.yaml
├── deployments/            # Application deployments
│   ├── api-gateway.yaml    # API Gateway (3 replicas)
│   ├── confession-service.yaml  # Core service (3 replicas)
│   ├── sentiment-service.yaml   # Sentiment analysis (2 replicas)
│   ├── redaction-service.yaml   # PII redaction (2 replicas)
│   ├── web.yaml            # Web frontend (2 replicas)
│   ├── admin.yaml          # Admin dashboard (2 replicas)
│   └── redis.yaml          # Redis cache
├── services/               # Service definitions
│   └── services.yaml       # ClusterIP and LoadBalancer services
├── hpa/                    # Horizontal Pod Autoscalers
│   └── hpa.yaml           # CPU/memory/connection based scaling
├── pdb/                    # Pod Disruption Budgets
│   └── pdb.yaml           # Minimum availability guarantees
├── ingress/               # Ingress and TLS
│   └── ingress.yaml       # Nginx ingress with TLS termination
├── kustomization.yaml     # Kustomize configuration
└── README.md              # This file
```

## Prerequisites

- Kubernetes cluster (1.25+)
- kubectl configured
- Nginx Ingress Controller
- cert-manager (for TLS certificates)
- Metrics Server (for HPA)

## Quick Start

### 1. Install Prerequisites

```bash
# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Install Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### 2. Configure Secrets

**IMPORTANT: Never commit real secrets to git!**

```bash
# Option 1: Edit secrets.yaml with real values (local only)
cp secrets/secrets.yaml secrets/secrets-local.yaml
# Edit secrets-local.yaml with real values
kubectl apply -f secrets/secrets-local.yaml

# Option 2: Use Sealed Secrets
kubeseal --format yaml < secrets/secrets.yaml > secrets/sealed-secrets.yaml
kubectl apply -f secrets/sealed-secrets.yaml

# Option 3: Use External Secrets Operator
# Configure your AWS Secrets Manager / Vault integration
```

### 3. Deploy

```bash
# Using Kustomize (recommended)
kubectl apply -k .

# Or apply individually
kubectl apply -f base/namespace.yaml
kubectl apply -f base/rbac.yaml
kubectl apply -f configmaps/
kubectl apply -f secrets/secrets.yaml  # Use sealed secrets in production!
kubectl apply -f deployments/
kubectl apply -f services/
kubectl apply -f hpa/
kubectl apply -f pdb/
kubectl apply -f ingress/
```

### 4. Verify Deployment

```bash
# Check all resources
kubectl get all -n void-confessions

# Check pod status
kubectl get pods -n void-confessions -w

# Check ingress
kubectl get ingress -n void-confessions

# Check TLS certificates
kubectl get certificates -n void-confessions
```

## Configuration

### Environment-specific Overrides

Create overlay directories for different environments:

```
kubernetes/
├── overlays/
│   ├── development/
│   │   └── kustomization.yaml
│   ├── staging/
│   │   └── kustomization.yaml
│   └── production/
│       └── kustomization.yaml
```

Example staging overlay:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
  - ../../
patchesStrategicMerge:
  - replica-patch.yaml
images:
  - name: void-confessions/api-gateway
    newTag: staging-v1.2.3
```

### Scaling

The HPA configurations automatically scale based on:
- CPU utilization (70% threshold)
- Memory utilization (80% threshold)
- HTTP requests per second (custom metric)
- WebSocket connections (custom metric)

Manual scaling:
```bash
kubectl scale deployment api-gateway -n void-confessions --replicas=5
```

### Monitoring

All pods expose Prometheus metrics:
- API Gateway: `:3000/metrics`
- Services: `:300X/metrics`

## Security Considerations

1. **Secrets Management**: Use Sealed Secrets or External Secrets Operator
2. **Network Policies**: Default deny with explicit allows
3. **Pod Security**: Non-root users, read-only filesystems
4. **TLS**: All traffic encrypted via cert-manager
5. **RBAC**: Minimal permissions per service

## Troubleshooting

```bash
# Check pod logs
kubectl logs -n void-confessions deployment/api-gateway

# Describe pod for events
kubectl describe pod -n void-confessions <pod-name>

# Check HPA status
kubectl get hpa -n void-confessions

# Check PDB status
kubectl get pdb -n void-confessions

# Debug network policies
kubectl get networkpolicies -n void-confessions
```

## Maintenance

### Rolling Updates
```bash
kubectl set image deployment/api-gateway -n void-confessions \
  api-gateway=void-confessions/api-gateway:v1.2.3
```

### Rollback
```bash
kubectl rollout undo deployment/api-gateway -n void-confessions
```

### Node Maintenance
The PDBs ensure minimum availability during voluntary disruptions.
