import { useMemo, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Link2, Send } from "lucide-react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  InfoList,
  Field,
  EmptyState,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDocs, getDoc, createDoc, addComment, type Doc } from "./api";

/**
 * Capability 2.1 — Documentation. ONE persona-aware knowledge base: the active
 * persona (from auth) selects the default doc types + suggested searches. Docs
 * link to catalog entries and carry version history + comments. Data comes from
 * getDocs(persona, …).
 */

interface PersonaDocsConfig {
  /** doc types this persona authors (drives the "New doc" + filter options) */
  types: string[];
  /** suggested searches shown as quick chips */
  suggested: string[];
}

const CONFIG: Record<string, PersonaDocsConfig> = {
  "ai-engineer": {
    types: [
      "LLM app runbook",
      "Prompt-design rationale",
      "Guardrail explanation",
      "Cost-tuning guide",
      "Post-mortem",
    ],
    suggested: ["support-rag", "guardrails", "faithfulness"],
  },
  "agentic-engineer": {
    types: [
      "Agent design doc",
      "Tool/permission rationale",
      "Autonomy-policy explanation",
      "Run post-mortem",
    ],
    suggested: ["autonomy", "tools", "post-mortem"],
  },
  "data-scientist": {
    types: ["Model card", "Experiment note", "Dataset usage guide", "Eval methodology"],
    suggested: ["churn-predictor", "model-card", "eval"],
  },
  "app-engineer": {
    types: ["Service README", "ADR", "Score-spec guide", "Deployment runbook"],
    suggested: ["checkout-api", "gitops", "runbook"],
  },
  mlops: {
    types: [
      "Pipeline design doc",
      "Drift-threshold rationale",
      "Retraining guide",
      "Infra sizing",
    ],
    suggested: ["churn-training", "drift", "retraining"],
  },
  security: {
    types: ["Policy description", "Compliance mapping", "IR playbook", "Access guide"],
    suggested: ["policy", "compliance", "ir"],
  },
  "data-engineer": {
    types: [
      "Dataset doc",
      "Pipeline design note",
      "DQ rationale",
      "Schema change log",
      "Feature-eng guide",
    ],
    suggested: ["orders_daily", "schema", "dq"],
  },
};

const Docs = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";
  const config = CONFIG[personaId] ?? { types: [], suggested: [] };

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [author, setAuthor] = useState("all");

  const { data: docs, loading, refetch } = useMockQuery(
    () => getDocs(personaId, { q, type, author }),
    [personaId, q, type, author]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail } = useMockQuery(
    () => (selectedId ? getDoc(personaId, selectedId) : Promise.resolve(undefined)),
    [personaId, selectedId]
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newLinked, setNewLinked] = useState("");
  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [commentDraft, setCommentDraft] = useState("");

  // Author options derived from the persona's data so the filter stays generic.
  const authorOptions = useMemo(
    () => Array.from(new Set((docs ?? []).map((d) => d.author))).sort(),
    [docs]
  );

  const resetCreate = () => {
    setNewTitle("");
    setNewType("");
    setNewTags("");
    setNewLinked("");
    setNewBody("");
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newType) {
      toast.error("Title and type are required.");
      return;
    }
    setSubmitting(true);
    try {
      const tags = newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const { doc_id } = await createDoc(personaId, {
        title: newTitle.trim(),
        type: newType,
        tags,
        body: newBody,
        linked_asset: newLinked.trim() || undefined,
      });
      toast.success(`Doc created (${doc_id})`);
      setCreateOpen(false);
      resetCreate();
      refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentDraft.trim() || !detail) return;
    const { comment_id } = await addComment(detail.id, commentDraft.trim());
    toast.success(`Comment added (${comment_id})`);
    setCommentDraft("");
  };

  const columns: Column<Doc>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (d) => <span className="font-medium">{d.title}</span>,
    },
    { key: "type", header: "Type", render: (d) => <StatusBadge tone="neutral">{d.type}</StatusBadge> },
    {
      key: "author",
      header: "Author",
      sortable: true,
      accessor: (d) => d.author,
      render: (d) => <span className="text-xs text-muted-foreground">{d.author}</span>,
    },
    {
      key: "tags",
      header: "Tags",
      render: (d) => (
        <div className="flex flex-wrap gap-1">
          {d.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "linked_asset",
      header: "Linked asset",
      render: (d) =>
        d.linked_asset ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs">
            <Link2 className="h-3 w-3 text-muted-foreground" />
            {d.linked_asset}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "updated_at",
      header: "Updated",
      sortable: true,
      accessor: (d) => d.updated_at,
      render: (d) => timeAgo(d.updated_at),
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-56 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Full-text search: titles, tags, authors, assets…"
          className="pl-9"
        />
      </div>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All doc types</SelectItem>
          {config.types.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={author} onValueChange={setAuthor}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All authors</SelectItem>
          {authorOptions.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Documentation"
        description="Searchable knowledge base linked to your catalog entries — runbooks, design docs, rationale, and post-mortems."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New doc
          </Button>
        }
      />

      {config.suggested.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Suggested:</span>
          {config.suggested.map((s) => (
            <button
              key={s}
              onClick={() => setQ(s)}
              className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={docs ?? []}
        rowKey={(d) => d.id}
        loading={loading}
        toolbar={toolbar}
        onRowClick={(d) => {
          setSelectedId(d.id);
          setCommentDraft("");
        }}
        emptyTitle="No docs match"
        emptyDescription="Adjust search or filters, or create a new doc."
      />

      {/* Detail drawer */}
      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={detail?.title ?? ""}
        description={detail ? `${detail.type} · ${detail.author} · updated ${timeAgo(detail.updated_at)}` : undefined}
        wide
      >
        {detail && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {detail.linked_asset && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-xs">
                  <Link2 className="h-3 w-3" />
                  {detail.linked_asset}
                </span>
              )}
              {detail.tags.map((t) => (
                <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>

            <SectionCard title="Document">
              <div className="prose prose-sm max-w-none rounded-lg border border-border bg-muted/30 p-4 text-sm dark:prose-invert">
                <ReactMarkdown>{detail.body}</ReactMarkdown>
              </div>
            </SectionCard>

            <SectionCard title="Version history">
              <InfoList
                items={detail.versions.map((v) => ({
                  label: `${v.version} · ${timeAgo(v.ts)}`,
                  value: (
                    <span className="text-right">
                      <span className="block">{v.note}</span>
                      <span className="block text-xs text-muted-foreground">{v.author}</span>
                    </span>
                  ),
                }))}
              />
            </SectionCard>

            <SectionCard title={`Comments & suggested edits (${detail.comments.length})`}>
              {detail.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                <div className="space-y-2">
                  {detail.comments.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">{c.author}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(c.ts)}</span>
                      </div>
                      <p className="text-sm">{c.body}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <Input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Add a comment or suggest an edit…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment();
                  }}
                />
                <Button variant="outline" onClick={handleAddComment} disabled={!commentDraft.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </SectionCard>
          </>
        )}
      </SideDrawer>

      {/* Create drawer */}
      <SideDrawer
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) resetCreate();
        }}
        title="New doc"
        description="Author a knowledge-base entry linked to a catalog asset."
        wide
      >
        <div className="space-y-4">
          <Field label="Title" htmlFor="doc-title" required>
            <Input
              id="doc-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. support-rag — Runbook"
            />
          </Field>

          <Field label="Doc type" required>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a doc type" />
              </SelectTrigger>
              <SelectContent>
                {config.types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Tags" htmlFor="doc-tags" hint="Comma-separated">
            <Input
              id="doc-tags"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="runbook, on-call, rag"
            />
          </Field>

          <Field label="Linked asset" htmlFor="doc-linked" hint="Catalog entry id or name (optional)">
            <Input
              id="doc-linked"
              value={newLinked}
              onChange={(e) => setNewLinked(e.target.value)}
              placeholder="e.g. support-rag"
            />
          </Field>

          <Field label="Body" htmlFor="doc-body" hint="Markdown supported">
            <Textarea
              id="doc-body"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={10}
              placeholder={"# Title\n\nWrite your documentation here…"}
              className="font-mono text-xs"
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                resetCreate();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating…" : "Create doc"}
            </Button>
          </div>
        </div>
      </SideDrawer>

      {personaId === "" && (
        <EmptyState title="No persona selected" description="Sign in with a persona to see your docs." />
      )}
    </div>
  );
};

export default Docs;
