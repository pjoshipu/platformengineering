import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "lucide-react";

interface DeveloperProfile {
  name: string;
  experience: string;
  team: string;
  techStack: string;
  role: string;
  query: string;
}

interface DynamicDemoInputsProps {
  demoId: string;
  onPayloadChange: (payload: any) => void;
  developerProfileId?: string;
  /** persona-driven field overrides (field name → value) applied on mount / change */
  contextSeed?: Record<string, string>;
  /** persona identity used as the developerContext for role-aware agents */
  personaProfile?: DeveloperProfile;
}

const DEVELOPER_PROFILES: Record<string, DeveloperProfile> = {
  "kevin-backend": {
    name: "Kevin Johnson",
    experience: "intermediate",
    team: "backend",
    techStack: "Python, Kubernetes, PostgreSQL",
    role: "Software Engineer",
    query: "How do I deploy a new microservice to our staging environment?"
  },
  "sarah-senior": {
    name: "Sarah Chen",
    experience: "advanced",
    team: "platform",
    techStack: "Terraform, AWS, Docker, Kubernetes",
    role: "Sr. Software Engineer",
    query: "What's the best practice for implementing blue-green deployments in our infrastructure?"
  },
  "mike-frontend": {
    name: "Mike Rodriguez",
    experience: "intermediate",
    team: "frontend",
    techStack: "React, TypeScript, GraphQL, Next.js",
    role: "Front-end Engineer",
    query: "How do I integrate authentication into our new dashboard component?"
  },
  "priya-platform": {
    name: "Priya Sharma",
    experience: "expert",
    team: "platform",
    techStack: "Kubernetes, Prometheus, Grafana, Istio",
    role: "Platform Engineer",
    query: "How can I set up service mesh observability for our microservices?"
  },
  "emma-mobile": {
    name: "Emma Davis",
    experience: "advanced",
    team: "mobile",
    techStack: "Kotlin, Swift, React Native, Firebase",
    role: "Mobile Engineer",
    query: "How do I implement push notifications for both iOS and Android?"
  },
  "james-ios": {
    name: "James Park",
    experience: "intermediate",
    team: "mobile",
    techStack: "Swift, SwiftUI, Core Data, Combine",
    role: "iOS Engineer",
    query: "What's the best way to handle offline data synchronization in our iOS app?"
  },
  "lisa-android": {
    name: "Lisa Wang",
    experience: "advanced",
    team: "mobile",
    techStack: "Kotlin, Jetpack Compose, Room, Coroutines",
    role: "Android Engineer",
    query: "How do I optimize our Android app's battery consumption?"
  },
  "tom-junior": {
    name: "Tom Wilson",
    experience: "beginner",
    team: "backend",
    techStack: "Node.js, MongoDB, Express",
    role: "Junior Software Engineer",
    query: "How do I access the development database?"
  },
  "alex-fullstack": {
    name: "Alex Kumar",
    experience: "advanced",
    team: "fullstack",
    techStack: "Go, React, PostgreSQL, Redis, Docker",
    role: "Full Stack Engineer",
    query: "How do I implement real-time features using WebSockets?"
  },
  "custom": {
    name: "Kevin Johnson",
    experience: "intermediate",
    team: "backend",
    techStack: "Python, Kubernetes, PostgreSQL",
    role: "Software Engineer",
    query: "How do I deploy a new microservice to our staging environment?"
  }
};

const DynamicDemoInputs = ({ demoId, onPayloadChange, developerProfileId, contextSeed, personaProfile }: DynamicDemoInputsProps) => {
  // Track previous demoId to detect actual changes
  const [prevDemoId, setPrevDemoId] = useState(demoId);

  // Developer Portal State - Initialize with provided profile if available
  const [selectedProfile, setSelectedProfile] = useState(developerProfileId || "kevin-backend");
  const [devName, setDevName] = useState("Kevin Johnson");
  const [devExperience, setDevExperience] = useState("intermediate");
  const [devTeam, setDevTeam] = useState("backend");
  const [devTechStack, setDevTechStack] = useState("Python, Kubernetes, PostgreSQL");
  const [devRole, setDevRole] = useState("Software Engineer");
  const [devQuery, setDevQuery] = useState("How do I deploy a new microservice to our staging environment?");

  // Workflow Diagnostic State
  const [errorLog, setErrorLog] = useState(`Error: Terraform apply failed
│ Error: Error creating S3 bucket: BucketAlreadyExists:
│ The requested bucket name is not available
│
│   with aws_s3_bucket.data_lake,
│   on main.tf line 15, in resource "aws_s3_bucket" "data_lake":
│   15: resource "aws_s3_bucket" "data_lake" {`);
  const [wfRepository, setWfRepository] = useState("infrastructure/terraform");
  const [wfBranch, setWfBranch] = useState("main");
  const [wfTrigger, setWfTrigger] = useState("push event");
  const [wfEnvironment, setWfEnvironment] = useState("production");
  const [wfLastSuccess, setWfLastSuccess] = useState("2 days ago");

  // Release Readiness State
  const [testCoverage, setTestCoverage] = useState("85.2");
  const [avgResponseTime, setAvgResponseTime] = useState("180");
  const [p95ResponseTime, setP95ResponseTime] = useState("250");
  const [p99ResponseTime, setP99ResponseTime] = useState("420");
  const [criticalVulns, setCriticalVulns] = useState("0");
  const [highVulns, setHighVulns] = useState("2");
  const [mediumVulns, setMediumVulns] = useState("5");
  const [maintainabilityScore, setMaintainabilityScore] = useState("75");
  const [techDebtHours, setTechDebtHours] = useState("12");
  const [codeSmells, setCodeSmells] = useState("8");
  const [successRate, setSuccessRate] = useState("94.5");
  const [rollbackCount, setRollbackCount] = useState("2");

  // Multi-Agent State
  const [compute1Type, setCompute1Type] = useState("m5.2xlarge");
  const [compute1Util, setCompute1Util] = useState("25");
  const [compute1Region, setCompute1Region] = useState("us-east-1");
  const [compute1Cost, setCompute1Cost] = useState("280");
  const [compute1Purpose, setCompute1Purpose] = useState("api-server");
  const [compute2Type, setCompute2Type] = useState("m5.xlarge");
  const [compute2Util, setCompute2Util] = useState("80");
  const [compute2Region, setCompute2Region] = useState("us-west-2");
  const [compute2Cost, setCompute2Cost] = useState("140");
  const [compute2Purpose, setCompute2Purpose] = useState("worker-node");
  const [dbType, setDbType] = useState("db.r5.large");
  const [dbConnections, setDbConnections] = useState("50");
  const [dbCapacity, setDbCapacity] = useState("1000");
  const [dbCost, setDbCost] = useState("360");
  const [dbUtil, setDbUtil] = useState("45");
  const [s3Usage, setS3Usage] = useState("1200");
  const [s3Cost, setS3Cost] = useState("28");
  const [uptimeSla, setUptimeSla] = useState("99.9");

  // Developer Onboarding State
  const [onboardName, setOnboardName] = useState("Alex Chen");
  const [onboardTeam, setOnboardTeam] = useState("platform");
  const [onboardExp, setOnboardExp] = useState("intermediate");
  const [onboardBg, setOnboardBg] = useState("AWS, Terraform, Kubernetes");
  const [onboardStart, setOnboardStart] = useState("2026-01-20");

  // Feature Flag Lifecycle State
  const [flagCount, setFlagCount] = useState("25");
  const [staleThreshold, setStaleThreshold] = useState("90");
  const [flagSamples, setFlagSamples] = useState("new_checkout, v2_ui_legacy, dark_mode, beta_api");

  // Security Posture State
  const [cveCount, setCveCount] = useState("3");
  const [criticalCves, setCriticalCves] = useState("1");
  const [secretsFound, setSecretsFound] = useState("2");
  const [iacDrift, setIacDrift] = useState("true");

  // Incident Response State
  const [incidentDesc, setIncidentDesc] = useState("API service returning 502 errors");
  const [affectedServices, setAffectedServices] = useState("api-gateway, user-service, auth-service");
  const [errorRate, setErrorRate] = useState("45");

  // Cost Optimization State
  const [costCompute, setCostCompute] = useState("m5.2xlarge (25% util)");
  const [costMonthly, setCostMonthly] = useState("280");
  const [costDb, setCostDb] = useState("db.r5.large (45% util)");

  // Update payload whenever inputs change
  const updatePayload = (demoType: string) => {
    let payload: any = {};

    switch (demoType) {
      case "developer-portal":
        payload = {
          query: devQuery,
          developerContext: {
            name: devName,
            experience_level: devExperience,
            team: devTeam,
            tech_stack: devTechStack.split(',').map(s => s.trim()),
            role: devRole
          }
        };
        break;

      case "workflow-diagnostic":
        const profile = personaProfile ?? (DEVELOPER_PROFILES[selectedProfile] || DEVELOPER_PROFILES["kevin-backend"]);
        payload = {
          errorLog: errorLog,
          workflowContext: `Repository: ${wfRepository}
Branch: ${wfBranch}
Triggered by: ${wfTrigger}
Environment: ${wfEnvironment}
Last successful run: ${wfLastSuccess}`,
          developerContext: {
            name: profile.name,
            experience_level: profile.experience,
            team: profile.team,
            tech_stack: profile.techStack.split(',').map(s => s.trim()),
            role: profile.role
          }
        };
        break;

      case "release-readiness":
        payload = {
          qualityMetrics: {
            test_coverage: parseFloat(testCoverage),
            performance: {
              avg_response_time_ms: parseInt(avgResponseTime),
              p95_response_time_ms: parseInt(p95ResponseTime),
              p99_response_time_ms: parseInt(p99ResponseTime)
            },
            security: {
              critical_vulnerabilities: parseInt(criticalVulns),
              high_vulnerabilities: parseInt(highVulns),
              medium_vulnerabilities: parseInt(mediumVulns),
              last_scan: new Date().toISOString()
            },
            code_quality: {
              maintainability_score: parseInt(maintainabilityScore),
              technical_debt_hours: parseInt(techDebtHours),
              code_smells: parseInt(codeSmells)
            },
            deployment_history: {
              last_deployment: new Date().toISOString(),
              success_rate_30d: parseFloat(successRate),
              rollback_count_30d: parseInt(rollbackCount)
            }
          }
        };
        break;

      case "multi-agent":
        payload = {
          infrastructureState: {
            compute: [
              {
                type: compute1Type,
                utilization: `${compute1Util}%`,
                region: compute1Region,
                monthly_cost: parseInt(compute1Cost),
                purpose: compute1Purpose
              },
              {
                type: compute2Type,
                utilization: `${compute2Util}%`,
                region: compute2Region,
                monthly_cost: parseInt(compute2Cost),
                purpose: compute2Purpose
              }
            ],
            databases: [
              {
                type: dbType,
                connections: parseInt(dbConnections),
                capacity: parseInt(dbCapacity),
                monthly_cost: parseInt(dbCost),
                utilization: `${dbUtil}%`
              }
            ],
            storage: {
              s3_usage_gb: parseInt(s3Usage),
              monthly_cost: parseInt(s3Cost)
            },
            uptime_sla: `${uptimeSla}%`,
            monthly_total_cost: parseInt(compute1Cost) + parseInt(compute2Cost) + parseInt(dbCost) + parseInt(s3Cost)
          }
        };
        break;

      case "developer-onboarding":
        payload = {
          name: onboardName,
          team: onboardTeam,
          experience_level: onboardExp,
          prev_background: onboardBg,
          start_date: onboardStart
        };
        break;

      case "feature-flag-lifecycle":
        payload = {
          flags_inventory: flagSamples.split(',').map((f, i) => ({
            flag_name: f.trim(),
            age_days: 90 + (i * 30),
            last_accessed: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
            owner_team: "platform"
          })),
          age_threshold_days: parseInt(staleThreshold)
        };
        break;

      case "security-posture":
        payload = {
          cves: [
            { id: "CVE-2025-1234", cvss_score: 9.1, affected_version: "2.3.0" }
          ],
          secrets_found_count: parseInt(secretsFound),
          iac_drift: iacDrift === "true",
          compliance_requirements: ["SOC2", "HIPAA"]
        };
        break;

      case "incident-response":
        payload = {
          description: incidentDesc,
          affected_services: affectedServices.split(',').map(s => s.trim()),
          detected_time: new Date().toISOString(),
          error_rate: parseFloat(errorRate),
          recent_deployments: [
            { service: "api-gateway", version: "2.1.0", deploy_time: new Date(Date.now() - 10 * 60 * 1000).toISOString() }
          ]
        };
        break;

      case "cost-optimization":
        payload = {
          compute_resources: [
            { instance: costCompute, utilization: "25%", cost_monthly: parseInt(costMonthly) },
            { instance: costDb, utilization: "45%", cost_monthly: 360 }
          ],
          utilization_metrics: {
            cpu_avg: 25,
            memory_avg: 35,
            network_avg: 15
          },
          period_days: 30
        };
        break;
    }

    onPayloadChange(payload);
  };

  // Auto-update payload whenever any state changes
  useEffect(() => {
    updatePayload(demoId);
  }, [
    demoId,
    selectedProfile,
    // Developer Portal
    devName, devExperience, devTeam, devTechStack, devRole, devQuery,
    // Workflow Diagnostic
    errorLog, wfRepository, wfBranch, wfTrigger, wfEnvironment, wfLastSuccess,
    // Release Readiness
    testCoverage, avgResponseTime, p95ResponseTime, p99ResponseTime,
    criticalVulns, highVulns, mediumVulns, maintainabilityScore,
    techDebtHours, codeSmells, successRate, rollbackCount,
    // Multi-Agent
    compute1Type, compute1Util, compute1Region, compute1Cost, compute1Purpose,
    compute2Type, compute2Util, compute2Region, compute2Cost, compute2Purpose,
    dbType, dbConnections, dbCapacity, dbCost, dbUtil,
    s3Usage, s3Cost, uptimeSla,
    // Developer Onboarding
    onboardName, onboardTeam, onboardExp, onboardBg, onboardStart,
    // Feature Flag Lifecycle
    flagCount, staleThreshold, flagSamples,
    // Security Posture
    cveCount, criticalCves, secretsFound, iacDrift,
    // Incident Response
    incidentDesc, affectedServices, errorRate,
    // Cost Optimization
    costCompute, costMonthly, costDb
  ]);

  // Reset to defaults ONLY when demo actually changes (not when just switching tabs)
  useEffect(() => {
    // Only reset if demoId actually changed
    if (prevDemoId !== demoId) {
      setPrevDemoId(demoId);

      // Reset developer portal state when switching to this demo
      if (demoId === "developer-portal") {
        const defaultProfile = DEVELOPER_PROFILES["kevin-backend"];
        setSelectedProfile("kevin-backend");
        setDevName(defaultProfile.name);
        setDevExperience(defaultProfile.experience);
        setDevTeam(defaultProfile.team);
        setDevTechStack(defaultProfile.techStack);
        setDevRole(defaultProfile.role);
        setDevQuery(defaultProfile.query);
      }
      // Reset other demo states to their defaults
      if (demoId === "workflow-diagnostic") {
        // Default to Kevin (Backend) profile for workflow diagnostic
        setSelectedProfile("kevin-backend");
        setErrorLog(`Error: API service deployment failed
│ Error: Container failed to start
│
│ 2025-01-15 10:23:45 ERROR [main] Database connection failed
│ 2025-01-15 10:23:45 ERROR Connection to postgres://db:5432/app_db refused
│ 2025-01-15 10:23:45 ERROR Could not connect to database: Connection refused
│ 2025-01-15 10:23:45 FATAL Exiting due to database connection failure
│
│ Container exit code: 1`);
        setWfRepository("backend/api-service");
        setWfBranch("main");
        setWfTrigger("push event");
        setWfEnvironment("production");
        setWfLastSuccess("2 days ago");
      }
    }
  }, [demoId, prevDemoId]);

  // Load developer profile
  const loadDeveloperProfile = (profileId: string) => {
    const profile = DEVELOPER_PROFILES[profileId];
    if (profile) {
      setSelectedProfile(profileId);
      setDevName(profile.name);
      setDevExperience(profile.experience);
      setDevTeam(profile.team);
      setDevTechStack(profile.techStack);
      setDevRole(profile.role);
      setDevQuery(profile.query);
      // Payload will auto-update via useEffect
    }
  };

  // Auto-load developer profile on mount if provided
  useEffect(() => {
    if (developerProfileId && demoId === "developer-portal") {
      loadDeveloperProfile(developerProfileId);
    }
  }, [developerProfileId]);

  // Apply persona-driven context seed. Declared AFTER the demo-change reset
  // effect so persona values override the hardcoded defaults for seeded fields.
  useEffect(() => {
    if (!contextSeed) return;
    const setters: Record<string, (v: string) => void> = {
      devName: setDevName, devExperience: setDevExperience, devTeam: setDevTeam,
      devTechStack: setDevTechStack, devRole: setDevRole, devQuery: setDevQuery,
      errorLog: setErrorLog, wfRepository: setWfRepository, wfBranch: setWfBranch,
      wfTrigger: setWfTrigger, wfEnvironment: setWfEnvironment, wfLastSuccess: setWfLastSuccess,
      testCoverage: setTestCoverage, avgResponseTime: setAvgResponseTime,
      p95ResponseTime: setP95ResponseTime, p99ResponseTime: setP99ResponseTime,
      criticalVulns: setCriticalVulns, highVulns: setHighVulns, mediumVulns: setMediumVulns,
      maintainabilityScore: setMaintainabilityScore, techDebtHours: setTechDebtHours,
      codeSmells: setCodeSmells, successRate: setSuccessRate, rollbackCount: setRollbackCount,
      onboardName: setOnboardName, onboardTeam: setOnboardTeam, onboardExp: setOnboardExp,
      onboardBg: setOnboardBg, onboardStart: setOnboardStart,
      flagCount: setFlagCount, staleThreshold: setStaleThreshold, flagSamples: setFlagSamples,
      cveCount: setCveCount, criticalCves: setCriticalCves, secretsFound: setSecretsFound,
      iacDrift: setIacDrift,
      incidentDesc: setIncidentDesc, affectedServices: setAffectedServices, errorRate: setErrorRate,
      costCompute: setCostCompute, costMonthly: setCostMonthly, costDb: setCostDb,
    };
    Object.entries(contextSeed).forEach(([field, value]) => setters[field]?.(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextSeed, demoId]);

  // Call state setter and mark as custom
  const handleInputChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setSelectedProfile("custom"); // Switch to custom when manually editing
    // Payload will auto-update via useEffect
  };

  if (demoId === "developer-portal") {
    const isLocked = !!developerProfileId; // Lock profile if provided (developer mode)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">👤 Developer Context</h4>
          {!isLocked && (
            <div className="flex items-center gap-2">
              <Label htmlFor="dev-profile" className="text-xs text-muted-foreground">
                Load Profile:
              </Label>
              <Select value={selectedProfile} onValueChange={loadDeveloperProfile}>
                <SelectTrigger className="w-[200px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectItem value="kevin-backend">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Kevin - Backend (Python/K8s)
                  </div>
                </SelectItem>
                <SelectItem value="sarah-senior">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Sarah - Sr. Platform (AWS/Terraform)
                  </div>
                </SelectItem>
                <SelectItem value="mike-frontend">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Mike - Frontend (React/TypeScript)
                  </div>
                </SelectItem>
                <SelectItem value="priya-platform">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Priya - Platform (K8s/Istio)
                  </div>
                </SelectItem>
                <SelectItem value="emma-mobile">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Emma - Mobile (Kotlin/Swift)
                  </div>
                </SelectItem>
                <SelectItem value="james-ios">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    James - iOS (Swift/SwiftUI)
                  </div>
                </SelectItem>
                <SelectItem value="lisa-android">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Lisa - Android (Kotlin/Compose)
                  </div>
                </SelectItem>
                <SelectItem value="alex-fullstack">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Alex - Full Stack (Go/React)
                  </div>
                </SelectItem>
                <SelectItem value="tom-junior">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Tom - Junior (Node.js)
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Custom Profile
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dev-name">Name</Label>
            <Input
              id="dev-name"
              value={devName}
              onChange={(e) => handleInputChange(setDevName, e.target.value)}
              placeholder="Developer name"
              disabled={isLocked}
              className={isLocked ? "bg-muted" : ""}
            />
          </div>

          <div>
            <Label htmlFor="dev-experience">Experience Level</Label>
            <Select value={devExperience} onValueChange={(val) => handleInputChange(setDevExperience, val)} disabled={isLocked}>
              <SelectTrigger className={isLocked ? "bg-muted" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dev-team">Team</Label>
            <Input
              id="dev-team"
              value={devTeam}
              onChange={(e) => handleInputChange(setDevTeam, e.target.value)}
              placeholder="e.g., backend, frontend, devops"
              disabled={isLocked}
              className={isLocked ? "bg-muted" : ""}
            />
          </div>

          <div>
            <Label htmlFor="dev-role">Role</Label>
            <Input
              id="dev-role"
              value={devRole}
              onChange={(e) => handleInputChange(setDevRole, e.target.value)}
              placeholder="e.g., Software Engineer"
              disabled={isLocked}
              className={isLocked ? "bg-muted" : ""}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="dev-tech-stack">Tech Stack (comma-separated)</Label>
          <Input
            id="dev-tech-stack"
            value={devTechStack}
            onChange={(e) => handleInputChange(setDevTechStack, e.target.value)}
            placeholder="e.g., Python, Kubernetes, PostgreSQL"
            disabled={isLocked}
            className={isLocked ? "bg-muted" : ""}
          />
        </div>

        <div>
          <Label htmlFor="dev-query">Developer Query</Label>
          <Textarea
            id="dev-query"
            value={devQuery}
            onChange={(e) => handleInputChange(setDevQuery, e.target.value)}
            placeholder="Enter the developer's question..."
            rows={3}
            disabled={false}
          />
        </div>
      </div>
    );
  }

  if (demoId === "workflow-diagnostic") {
    // Role-specific error scenarios
    const loadRoleSpecificError = (profileId: string) => {
      const profile = DEVELOPER_PROFILES[profileId];
      if (!profile) return;

      setSelectedProfile(profileId);

      // Set role-specific error based on team
      if (profile.team === "frontend") {
        setErrorLog(`Error: Build failed for web application
│ Error: Module build failed (from ./node_modules/babel-loader/lib/index.js):
│ SyntaxError: /app/src/components/Dashboard.tsx: Unexpected token (45:12)
│
│   43 |   return (
│   44 |     <div className="dashboard">
│ > 45 |       {data?.map(item =>
│      |            ^
│   46 |         <Card key={item.id}>{item.name}</Card>
│   47 |       )}
│   48 |     </div>
│
│ at webpack:///./src/components/Dashboard.tsx`);
        setWfRepository("frontend/web-app");
        setWfBranch("feature/dashboard-redesign");
        setWfTrigger("pull request");
        setWfEnvironment("staging");
      } else if (profile.team === "mobile") {
        setErrorLog(`Error: iOS build failed
│ ❌ error: Signing for "MyApp" requires a development team.
│ Select a development team in the Signing & Capabilities editor. (in target 'MyApp' from project 'MyApp')
│
│ ▸ Code Signing Error: Code signing is required for product type 'Application' in SDK 'iOS 16.0'
│ ▸ Building workspace MyApp with scheme MyApp
│ ▸ Destination: generic/platform=iOS
│
│ ** BUILD FAILED **`);
        setWfRepository("mobile/ios-app");
        setWfBranch("main");
        setWfTrigger("push event");
        setWfEnvironment("production");
      } else if (profile.team === "backend") {
        setErrorLog(`Error: API service deployment failed
│ Error: Container failed to start
│
│ 2025-01-15 10:23:45 ERROR [main] Database connection failed
│ 2025-01-15 10:23:45 ERROR Connection to postgres://db:5432/app_db refused
│ 2025-01-15 10:23:45 ERROR Could not connect to database: Connection refused
│ 2025-01-15 10:23:45 FATAL Exiting due to database connection failure
│
│ Container exit code: 1`);
        setWfRepository("backend/api-service");
        setWfBranch("main");
        setWfTrigger("push event");
        setWfEnvironment("production");
      } else if (profile.team === "platform") {
        setErrorLog(`Error: Terraform apply failed
│ Error: Error creating S3 bucket: BucketAlreadyExists:
│ The requested bucket name is not available
│
│   with aws_s3_bucket.data_lake,
│   on main.tf line 15, in resource "aws_s3_bucket" "data_lake":
│   15: resource "aws_s3_bucket" "data_lake" {`);
        setWfRepository("infrastructure/terraform");
        setWfBranch("main");
        setWfTrigger("push event");
        setWfEnvironment("production");
      } else {
        // Default/fullstack
        setErrorLog(`Error: Kubernetes deployment failed
│ Error: Failed to pull image "myapp:v1.2.3": rpc error: code = Unknown
│ desc = Error response from daemon: manifest for myapp:v1.2.3 not found
│
│ Warning  Failed     2m   kubelet  Failed to pull image "myapp:v1.2.3": rpc error
│ Warning  Failed     2m   kubelet  Error: ImagePullBackOff`);
        setWfRepository("apps/kubernetes");
        setWfBranch("main");
        setWfTrigger("push event");
        setWfEnvironment("production");
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">📋 Workflow Diagnostic Inputs</h4>
          <div className="flex items-center gap-2">
            <Label htmlFor="diagnostic-profile" className="text-xs text-muted-foreground">
              Load Profile:
            </Label>
            <Select value={selectedProfile} onValueChange={loadRoleSpecificError}>
              <SelectTrigger className="w-[200px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectItem value="kevin-backend">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Kevin - Backend (API Service)
                  </div>
                </SelectItem>
                <SelectItem value="sarah-senior">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Sarah - Platform (Terraform/AWS)
                  </div>
                </SelectItem>
                <SelectItem value="mike-frontend">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Mike - Frontend (React Build)
                  </div>
                </SelectItem>
                <SelectItem value="priya-platform">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Priya - Platform (K8s Deploy)
                  </div>
                </SelectItem>
                <SelectItem value="emma-mobile">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Emma - Mobile (iOS/Android)
                  </div>
                </SelectItem>
                <SelectItem value="james-ios">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    James - iOS (Swift Build)
                  </div>
                </SelectItem>
                <SelectItem value="lisa-android">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Lisa - Android (Kotlin Build)
                  </div>
                </SelectItem>
                <SelectItem value="alex-fullstack">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Alex - Full Stack (K8s Deploy)
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Custom Error
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="error-log">Error Log</Label>
          <Textarea
            id="error-log"
            value={errorLog}
            onChange={(e) => {
              setErrorLog(e.target.value);
              setSelectedProfile("custom");
            }}
            placeholder="Paste error log here..."
            rows={8}
            className="font-mono text-xs"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="wf-repository">Repository</Label>
            <Input
              id="wf-repository"
              value={wfRepository}
              onChange={(e) => handleInputChange(setWfRepository, e.target.value)}
              placeholder="e.g., infrastructure/terraform"
            />
          </div>

          <div>
            <Label htmlFor="wf-branch">Branch</Label>
            <Input
              id="wf-branch"
              value={wfBranch}
              onChange={(e) => handleInputChange(setWfBranch, e.target.value)}
              placeholder="e.g., main"
            />
          </div>

          <div>
            <Label htmlFor="wf-trigger">Triggered By</Label>
            <Input
              id="wf-trigger"
              value={wfTrigger}
              onChange={(e) => handleInputChange(setWfTrigger, e.target.value)}
              placeholder="e.g., push event"
            />
          </div>

          <div>
            <Label htmlFor="wf-environment">Environment</Label>
            <Input
              id="wf-environment"
              value={wfEnvironment}
              onChange={(e) => handleInputChange(setWfEnvironment, e.target.value)}
              placeholder="e.g., production"
            />
          </div>

          <div>
            <Label htmlFor="wf-last-success">Last Successful Run</Label>
            <Input
              id="wf-last-success"
              value={wfLastSuccess}
              onChange={(e) => handleInputChange(setWfLastSuccess, e.target.value)}
              placeholder="e.g., 2 days ago"
            />
          </div>
        </div>
      </div>
    );
  }

  if (demoId === "release-readiness") {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-sm mb-3">📊 Release Readiness Metrics</h4>

        <div className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <h5 className="font-semibold text-sm mb-2">Testing</h5>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="test-coverage">Test Coverage (%)</Label>
                <Input
                  id="test-coverage"
                  type="number"
                  step="0.1"
                  value={testCoverage}
                  onChange={(e) => handleInputChange(setTestCoverage, e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <h5 className="font-semibold text-sm mb-2">Performance</h5>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="avg-response">Avg Response (ms)</Label>
                <Input
                  id="avg-response"
                  type="number"
                  value={avgResponseTime}
                  onChange={(e) => handleInputChange(setAvgResponseTime, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="p95-response">P95 Response (ms)</Label>
                <Input
                  id="p95-response"
                  type="number"
                  value={p95ResponseTime}
                  onChange={(e) => handleInputChange(setP95ResponseTime, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="p99-response">P99 Response (ms)</Label>
                <Input
                  id="p99-response"
                  type="number"
                  value={p99ResponseTime}
                  onChange={(e) => handleInputChange(setP99ResponseTime, e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <h5 className="font-semibold text-sm mb-2">Security</h5>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="critical-vulns">Critical Vulnerabilities</Label>
                <Input
                  id="critical-vulns"
                  type="number"
                  value={criticalVulns}
                  onChange={(e) => handleInputChange(setCriticalVulns, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="high-vulns">High Vulnerabilities</Label>
                <Input
                  id="high-vulns"
                  type="number"
                  value={highVulns}
                  onChange={(e) => handleInputChange(setHighVulns, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="medium-vulns">Medium Vulnerabilities</Label>
                <Input
                  id="medium-vulns"
                  type="number"
                  value={mediumVulns}
                  onChange={(e) => handleInputChange(setMediumVulns, e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <h5 className="font-semibold text-sm mb-2">Code Quality</h5>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="maintainability">Maintainability Score</Label>
                <Input
                  id="maintainability"
                  type="number"
                  value={maintainabilityScore}
                  onChange={(e) => handleInputChange(setMaintainabilityScore, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tech-debt">Tech Debt (hours)</Label>
                <Input
                  id="tech-debt"
                  type="number"
                  value={techDebtHours}
                  onChange={(e) => handleInputChange(setTechDebtHours, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="code-smells">Code Smells</Label>
                <Input
                  id="code-smells"
                  type="number"
                  value={codeSmells}
                  onChange={(e) => handleInputChange(setCodeSmells, e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <h5 className="font-semibold text-sm mb-2">Deployment History</h5>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="success-rate">Success Rate (%) - 30 days</Label>
                <Input
                  id="success-rate"
                  type="number"
                  step="0.1"
                  value={successRate}
                  onChange={(e) => handleInputChange(setSuccessRate, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rollback-count">Rollback Count - 30 days</Label>
                <Input
                  id="rollback-count"
                  type="number"
                  value={rollbackCount}
                  onChange={(e) => handleInputChange(setRollbackCount, e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (demoId === "multi-agent") {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-sm mb-3">🏗️ Infrastructure Configuration</h4>

        <div className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <h5 className="font-semibold text-sm mb-2">💻 Compute Resource #1</h5>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="compute1-type">Instance Type</Label>
                <Input
                  id="compute1-type"
                  value={compute1Type}
                  onChange={(e) => handleInputChange(setCompute1Type, e.target.value)}
                  placeholder="e.g., m5.2xlarge"
                />
              </div>
              <div>
                <Label htmlFor="compute1-util">Utilization (%)</Label>
                <Input
                  id="compute1-util"
                  type="number"
                  value={compute1Util}
                  onChange={(e) => handleInputChange(setCompute1Util, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="compute1-region">Region</Label>
                <Input
                  id="compute1-region"
                  value={compute1Region}
                  onChange={(e) => handleInputChange(setCompute1Region, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="compute1-cost">Monthly Cost ($)</Label>
                <Input
                  id="compute1-cost"
                  type="number"
                  value={compute1Cost}
                  onChange={(e) => handleInputChange(setCompute1Cost, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="compute1-purpose">Purpose</Label>
                <Input
                  id="compute1-purpose"
                  value={compute1Purpose}
                  onChange={(e) => handleInputChange(setCompute1Purpose, e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <h5 className="font-semibold text-sm mb-2">💻 Compute Resource #2</h5>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="compute2-type">Instance Type</Label>
                <Input
                  id="compute2-type"
                  value={compute2Type}
                  onChange={(e) => handleInputChange(setCompute2Type, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="compute2-util">Utilization (%)</Label>
                <Input
                  id="compute2-util"
                  type="number"
                  value={compute2Util}
                  onChange={(e) => handleInputChange(setCompute2Util, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="compute2-region">Region</Label>
                <Input
                  id="compute2-region"
                  value={compute2Region}
                  onChange={(e) => handleInputChange(setCompute2Region, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="compute2-cost">Monthly Cost ($)</Label>
                <Input
                  id="compute2-cost"
                  type="number"
                  value={compute2Cost}
                  onChange={(e) => handleInputChange(setCompute2Cost, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="compute2-purpose">Purpose</Label>
                <Input
                  id="compute2-purpose"
                  value={compute2Purpose}
                  onChange={(e) => handleInputChange(setCompute2Purpose, e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <h5 className="font-semibold text-sm mb-2">🗄️ Database</h5>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="db-type">Database Type</Label>
                <Input
                  id="db-type"
                  value={dbType}
                  onChange={(e) => handleInputChange(setDbType, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="db-connections">Connections</Label>
                <Input
                  id="db-connections"
                  type="number"
                  value={dbConnections}
                  onChange={(e) => handleInputChange(setDbConnections, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="db-capacity">Capacity</Label>
                <Input
                  id="db-capacity"
                  type="number"
                  value={dbCapacity}
                  onChange={(e) => handleInputChange(setDbCapacity, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="db-cost">Monthly Cost ($)</Label>
                <Input
                  id="db-cost"
                  type="number"
                  value={dbCost}
                  onChange={(e) => handleInputChange(setDbCost, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="db-util">Utilization (%)</Label>
                <Input
                  id="db-util"
                  type="number"
                  value={dbUtil}
                  onChange={(e) => handleInputChange(setDbUtil, e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <h5 className="font-semibold text-sm mb-2">📦 Storage</h5>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="s3-usage">S3 Usage (GB)</Label>
                <Input
                  id="s3-usage"
                  type="number"
                  value={s3Usage}
                  onChange={(e) => handleInputChange(setS3Usage, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="s3-cost">Monthly Cost ($)</Label>
                <Input
                  id="s3-cost"
                  type="number"
                  value={s3Cost}
                  onChange={(e) => handleInputChange(setS3Cost, e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="uptime-sla">Uptime SLA (%)</Label>
                <Input
                  id="uptime-sla"
                  type="number"
                  step="0.1"
                  value={uptimeSla}
                  onChange={(e) => handleInputChange(setUptimeSla, e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (demoId === "developer-onboarding") {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-sm mb-3">👤 Developer Onboarding</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="onboard-name">Name</Label>
            <Input id="onboard-name" value={onboardName} onChange={(e) => handleInputChange(setOnboardName, e.target.value)} placeholder="Developer name" />
          </div>
          <div>
            <Label htmlFor="onboard-team">Team</Label>
            <Input id="onboard-team" value={onboardTeam} onChange={(e) => handleInputChange(setOnboardTeam, e.target.value)} placeholder="e.g., platform" />
          </div>
          <div>
            <Label htmlFor="onboard-exp">Experience Level</Label>
            <Select value={onboardExp} onValueChange={(val) => handleInputChange(setOnboardExp, val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="onboard-start">Start Date</Label>
            <Input id="onboard-start" type="date" value={onboardStart} onChange={(e) => handleInputChange(setOnboardStart, e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="onboard-bg">Previous Background</Label>
            <Input id="onboard-bg" value={onboardBg} onChange={(e) => handleInputChange(setOnboardBg, e.target.value)} placeholder="e.g., AWS, Terraform" />
          </div>
        </div>
      </div>
    );
  }

  if (demoId === "feature-flag-lifecycle") {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-sm mb-3">🚩 Feature Flag Lifecycle</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="flag-count">Total Flags</Label>
            <Input id="flag-count" type="number" value={flagCount} onChange={(e) => handleInputChange(setFlagCount, e.target.value)} />
          </div>
          <div>
            <Label htmlFor="stale-threshold">Stale Threshold (days)</Label>
            <Input id="stale-threshold" type="number" value={staleThreshold} onChange={(e) => handleInputChange(setStaleThreshold, e.target.value)} />
          </div>
          <div>
            <Label htmlFor="flag-samples">Sample Flag Names (comma-separated)</Label>
            <Textarea id="flag-samples" value={flagSamples} onChange={(e) => handleInputChange(setFlagSamples, e.target.value)} placeholder="Flag1, Flag2, Flag3" rows={3} />
          </div>
        </div>
      </div>
    );
  }

  if (demoId === "security-posture") {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-sm mb-3">🛡️ Security Posture</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cve-count">Total CVEs</Label>
            <Input id="cve-count" type="number" value={cveCount} onChange={(e) => handleInputChange(setCveCount, e.target.value)} />
          </div>
          <div>
            <Label htmlFor="critical-cves">Critical CVEs</Label>
            <Input id="critical-cves" type="number" value={criticalCves} onChange={(e) => handleInputChange(setCriticalCves, e.target.value)} />
          </div>
          <div>
            <Label htmlFor="secrets-found">Secrets Found</Label>
            <Input id="secrets-found" type="number" value={secretsFound} onChange={(e) => handleInputChange(setSecretsFound, e.target.value)} />
          </div>
          <div>
            <Label htmlFor="iac-drift">IaC Drift</Label>
            <Select value={iacDrift} onValueChange={(val) => handleInputChange(setIacDrift, val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Detected</SelectItem>
                <SelectItem value="false">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  if (demoId === "incident-response") {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-sm mb-3">🚨 Incident Response</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="incident-desc">Incident Description</Label>
            <Textarea id="incident-desc" value={incidentDesc} onChange={(e) => handleInputChange(setIncidentDesc, e.target.value)} placeholder="Describe the incident..." rows={3} />
          </div>
          <div>
            <Label htmlFor="affected-services">Affected Services (comma-separated)</Label>
            <Input id="affected-services" value={affectedServices} onChange={(e) => handleInputChange(setAffectedServices, e.target.value)} placeholder="service1, service2" />
          </div>
          <div>
            <Label htmlFor="error-rate">Error Rate (%)</Label>
            <Input id="error-rate" type="number" step="0.1" value={errorRate} onChange={(e) => handleInputChange(setErrorRate, e.target.value)} />
          </div>
        </div>
      </div>
    );
  }

  if (demoId === "cost-optimization") {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-sm mb-3">💰 Cost Optimization</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cost-compute">Compute Resource</Label>
            <Input id="cost-compute" value={costCompute} onChange={(e) => handleInputChange(setCostCompute, e.target.value)} placeholder="e.g., m5.2xlarge (25% util)" />
          </div>
          <div>
            <Label htmlFor="cost-monthly">Monthly Cost ($)</Label>
            <Input id="cost-monthly" type="number" value={costMonthly} onChange={(e) => handleInputChange(setCostMonthly, e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cost-db">Database</Label>
            <Input id="cost-db" value={costDb} onChange={(e) => handleInputChange(setCostDb, e.target.value)} placeholder="e.g., db.r5.large (45% util)" />
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-muted-foreground">No inputs available for this demo</div>;
};

export default DynamicDemoInputs;
