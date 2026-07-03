import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, CheckCircle2, Loader2, Circle } from "lucide-react";
import {
  PageHeader,
  Field,
  SectionCard,
  KeyValueEditor,
  type KeyValuePair,
} from "@/idp/components";
import { Loading } from "@/idp/components/states";
import { useMockQuery } from "@/idp/api/client";
import { getScoreTemplate, createService, getDeploymentStatus, type PipelineStep } from "./api";

const PIPELINE_PREVIEW = [
  "Platform parses Score spec",
  "Declared resources provisioned",
  "Manifests committed to GitOps repo",
  "GitOps controller syncs to cluster",
  "API gateway route created (if enabled)",
  "Health check passes",
  "Service live",
];

const StepIcon = ({ status }: { status: PipelineStep["status"] }) =>
  status === "success" ? (
    <CheckCircle2 className="w-4 h-4 text-green-600" />
  ) : status === "running" ? (
    <Loader2 className="w-4 h-4 text-primary animate-spin" />
  ) : status === "failed" ? (
    <Circle className="w-4 h-4 text-destructive" />
  ) : (
    <Circle className="w-4 h-4 text-muted-foreground/40" />
  );

const NewServiceRequest = () => {
  const { data: template } = useMockQuery(getScoreTemplate, []);
  const [name, setName] = useState("");
  const [env, setEnv] = useState("Dev");
  const [image, setImage] = useState("registry.internal/my-service:latest");
  const [replicas, setReplicas] = useState(2);
  const [cpu, setCpu] = useState(250);
  const [mem, setMem] = useState(256);
  const [envVars, setEnvVars] = useState<KeyValuePair[]>([{ key: "LOG_LEVEL", value: "info" }]);
  const [gatewayOn, setGatewayOn] = useState(false);
  const [routePrefix, setRoutePrefix] = useState("/api/my-service");
  const [authType, setAuthType] = useState("JWT");
  const [manualYaml, setManualYaml] = useState<string | null>(null);

  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const { data: status } = useMockQuery(
    () => (deploymentId ? getDeploymentStatus(deploymentId) : Promise.resolve(undefined)),
    [deploymentId]
  );

  const generatedYaml = useMemo(() => {
    const envBlock = envVars
      .filter((v) => v.key)
      .map((v) => `      ${v.key}: ${v.value}`)
      .join("\n");
    return `apiVersion: score.dev/v1b1
metadata:
  name: ${name || "my-service"}
containers:
  main:
    image: ${image}
    variables:
${envBlock || "      LOG_LEVEL: info"}
    resources:
      requests: { cpu: "${cpu}m", memory: "${mem}Mi" }
service:
  ports:
    http: { port: 8080 }
# replicas: ${replicas} · env: ${env}${gatewayOn ? `\n# gateway: ${routePrefix} (${authType})` : ""}`;
  }, [name, image, envVars, cpu, mem, replicas, env, gatewayOn, routePrefix, authType]);

  // Show the user's manual edits if any, otherwise the spec generated live from
  // the form fields. The fetched template seeds the textarea's initial content.
  const displayYaml = manualYaml ?? template?.yaml_template ?? generatedYaml;

  const submit = async () => {
    if (!name) {
      toast.error("Service name is required");
      return;
    }
    const { deployment_id } = await createService({ score_yaml: displayYaml, env, image, replicas });
    setDeploymentId(deployment_id);
    toast.success("Deployment triggered");
  };

  if (deploymentId) {
    return (
      <div>
        <PageHeader title="Deployment status" description={`Pipeline run for ${name}`} backTo="/idp/app-engineer/my-services" backLabel="My Services" />
        <SectionCard title="Pipeline">
          {!status ? (
            <Loading label="Starting pipeline…" />
          ) : (
            <ol className="space-y-3">
              {status.steps.map((step) => (
                <li key={step.name} className="flex items-start gap-3">
                  <StepIcon status={step.status} />
                  <div>
                    <div className="text-sm font-medium">{step.name}</div>
                    {step.log && <div className="text-xs text-muted-foreground font-mono">{step.log}</div>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="New Service Request"
        description="Submit a new service deployment using a Score spec. The platform parses the spec and deploys via GitOps."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4">
          <Field label="Service name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="orders-api" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Target environment">
              <Select value={env} onValueChange={setEnv}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dev">Dev</SelectItem>
                  <SelectItem value="Staging">Staging</SelectItem>
                  <SelectItem value="Prod">Prod</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Replicas">
              <Input type="number" value={replicas} onChange={(e) => setReplicas(+e.target.value)} />
            </Field>
          </div>
          <Field label="Container image">
            <Input value={image} onChange={(e) => setImage(e.target.value)} className="font-mono text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="CPU request (millicores)">
              <Input type="number" value={cpu} onChange={(e) => setCpu(+e.target.value)} />
            </Field>
            <Field label="Memory request (MB)">
              <Input type="number" value={mem} onChange={(e) => setMem(+e.target.value)} />
            </Field>
          </div>
          <Field label="Environment variables">
            <KeyValueEditor pairs={envVars} onChange={setEnvVars} />
          </Field>

          <SectionCard>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Expose via API gateway</div>
                <div className="text-xs text-muted-foreground">Create a public route for this service</div>
              </div>
              <Switch checked={gatewayOn} onCheckedChange={setGatewayOn} />
            </div>
            {gatewayOn && (
              <div className="mt-4 space-y-3">
                <Field label="Route path prefix">
                  <Input value={routePrefix} onChange={(e) => setRoutePrefix(e.target.value)} className="font-mono text-sm" />
                </Field>
                <Field label="Auth type">
                  <Select value={authType} onValueChange={setAuthType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="API key">API key</SelectItem>
                      <SelectItem value="JWT">JWT</SelectItem>
                      <SelectItem value="OAuth2">OAuth2</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}
          </SectionCard>
        </div>

        {/* YAML + pipeline preview */}
        <div className="space-y-4">
          <SectionCard
            title="Score spec preview"
            actions={
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(displayYaml); toast.success("YAML copied"); }}>
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
            }
          >
            <Textarea
              value={displayYaml}
              onChange={(e) => setManualYaml(e.target.value)}
              className="font-mono text-xs h-64"
            />
          </SectionCard>

          <SectionCard title="Pipeline steps">
            <ol className="space-y-2">
              {PIPELINE_PREVIEW.map((step, i) => (
                <li key={step} className="flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </SectionCard>

          <Button className="w-full" onClick={submit}>Submit deployment</Button>
        </div>
      </div>
    </div>
  );
};

export default NewServiceRequest;
