import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowUp,
  MessageSquare,
  CheckCircle2,
  Bell,
  Pin,
  Lock,
  Trash2,
  Link2,
  Plus,
} from "lucide-react";
import {
  PageHeader,
  StatusBadge,
  SideDrawer,
  SectionCard,
  Field,
  EmptyState,
  type Tone,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getThreads,
  getThread,
  voteThread,
  addComment,
  acceptAnswer,
  followThread,
  moderate,
  getPersonaTags,
  PERSONA_TAGS,
  type Thread,
  type ThreadType,
} from "./api";

/**
 * Capability 2.2 — Forum. ONE persona-aware screen: the active persona (from
 * auth) selects the topic tags used across threads and the "For you" filter,
 * and unlocks moderation controls for `security`. Data comes from
 * getThreads(persona, …).
 */

const TYPE_TONE: Record<ThreadType, Tone> = {
  Question: "info",
  Discussion: "neutral",
  Proposal: "active",
  Announcement: "success",
};

const POST_TYPES: ThreadType[] = ["Question", "Discussion", "Proposal", "Announcement"];

const Forum = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";
  const isSecurity = personaId === "security";

  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"newest" | "top">("newest");

  const { data: threads, loading } = useMockQuery(
    () => getThreads(personaId, { type, q, sort }),
    [personaId, type, q, sort]
  );

  const tagOptions = useMemo(() => getPersonaTags(personaId), [personaId]);

  // New-post drawer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [newType, setNewType] = useState<ThreadType>("Question");
  const [newTitle, setNewTitle] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newBody, setNewBody] = useState("");

  const submitPost = () => {
    if (!newTitle.trim()) {
      toast.error("Add a title for your post.");
      return;
    }
    toast.success(`Posted ${newType.toLowerCase()}: "${newTitle.trim()}"`);
    setComposerOpen(false);
    setNewTitle("");
    setNewTags("");
    setNewBody("");
    setNewType("Question");
  };

  // Detail drawer state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail } = useMockQuery(
    () => (selectedId ? getThread(personaId, selectedId) : Promise.resolve(undefined)),
    [personaId, selectedId]
  );
  const [comment, setComment] = useState("");

  const onVote = async (t: Thread) => {
    await voteThread(t.id, "up");
    toast(`Upvoted "${t.title}"`);
  };
  const onFollow = async (t: Thread) => {
    await followThread(t.id);
    toast(`Following "${t.title}"`);
  };
  const onAccept = async (t: Thread, commentId: string) => {
    await acceptAnswer(t.id, commentId);
    toast.success("Answer accepted");
  };
  const onModerate = async (t: Thread, action: "pin" | "lock" | "remove") => {
    await moderate(t.id, action);
    toast(`${action.charAt(0).toUpperCase() + action.slice(1)}: "${t.title}"`);
  };
  const onAddComment = async (t: Thread) => {
    if (!comment.trim()) return;
    await addComment(t.id, comment.trim());
    toast.success("Comment added");
    setComment("");
  };

  const list = threads ?? [];

  return (
    <div>
      <PageHeader
        title="Forum"
        description={
          isSecurity
            ? "Cross-persona discussion. As security you can pin, lock, and remove posts."
            : "Ask questions, propose changes, and follow discussions across the platform."
        }
        actions={
          <Button onClick={() => setComposerOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New post
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search posts, tags, authors…"
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All post types</SelectItem>
            {POST_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as "newest" | "top")}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="top">Top</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Thread list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No posts match"
          description="Adjust your search or filters, or start a new post."
        />
      ) : (
        <div className="space-y-2">
          {list.map((t) => (
            <Card
              key={t.id}
              className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedId(t.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center text-muted-foreground shrink-0 w-10">
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-sm font-medium text-foreground">{t.votes}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge tone={TYPE_TONE[t.type]}>{t.type}</StatusBadge>
                    {t.type === "Question" && t.answered && (
                      <StatusBadge tone="success">
                        <CheckCircle2 className="w-3 h-3" />
                        Answered
                      </StatusBadge>
                    )}
                  </div>
                  <h3 className="font-semibold truncate">{t.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{t.body}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {t.tags.map((tag) => (
                      <StatusBadge key={tag} tone="neutral">
                        {tag}
                      </StatusBadge>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{t.author}</span>
                    <span>·</span>
                    <span>{timeAgo(t.created_at)}</span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {t.comments.length}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                      {t.followers}
                    </span>
                    {t.linked && (
                      <span className="inline-flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        {t.linked}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New post drawer */}
      <SideDrawer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        title="New post"
        description="Share a question, discussion, proposal, or announcement."
      >
        <div className="space-y-4">
          <Field label="Post type" htmlFor="post-type">
            <Select value={newType} onValueChange={(v) => setNewType(v as ThreadType)}>
              <SelectTrigger id="post-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POST_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Title" htmlFor="post-title" required>
            <Input
              id="post-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="A clear, specific title"
            />
          </Field>
          <Field
            label="Tags"
            htmlFor="post-tags"
            hint={`Comma-separated. Suggested: ${(PERSONA_TAGS[personaId] ?? []).join(", ") || "—"}`}
          >
            <Input
              id="post-tags"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="e.g. cost, RAG"
            />
          </Field>
          <Field label="Body" htmlFor="post-body">
            <Textarea
              id="post-body"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Add detail, context, and what you've already tried…"
              rows={6}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPost}>Post</Button>
          </div>
        </div>
      </SideDrawer>

      {/* Thread detail drawer */}
      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={detail?.title ?? ""}
        description={detail ? `${detail.type} · ${detail.author} · ${timeAgo(detail.created_at)}` : undefined}
        wide
      >
        {detail && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={TYPE_TONE[detail.type]}>{detail.type}</StatusBadge>
              {detail.type === "Question" && detail.answered && (
                <StatusBadge tone="success">
                  <CheckCircle2 className="w-3 h-3" />
                  Answered
                </StatusBadge>
              )}
              {detail.tags.map((tag) => (
                <StatusBadge key={tag} tone="neutral">
                  {tag}
                </StatusBadge>
              ))}
            </div>

            <p className="text-sm whitespace-pre-wrap">{detail.body}</p>

            {detail.linked && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                Linked to <span className="font-mono">{detail.linked}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onVote(detail)}>
                <ArrowUp className="w-4 h-4 mr-1" />
                Upvote ({detail.votes})
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFollow(detail)}>
                <Bell className="w-4 h-4 mr-1" />
                Follow ({detail.followers})
              </Button>
            </div>

            {isSecurity && (
              <SectionCard title="Moderation">
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onModerate(detail, "pin")}>
                    <Pin className="w-4 h-4 mr-1" />
                    Pin
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onModerate(detail, "lock")}>
                    <Lock className="w-4 h-4 mr-1" />
                    Lock
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onModerate(detail, "remove")}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </SectionCard>
            )}

            <SectionCard title={`Comments (${detail.comments.length})`}>
              {detail.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to reply.</p>
              ) : (
                <div className="space-y-3">
                  {detail.comments.map((c) => {
                    const isAccepted = detail.accepted_answer_id === c.id;
                    return (
                      <div
                        key={c.id}
                        className={
                          "rounded-lg border p-3 " +
                          (isAccepted ? "border-green-500/40 bg-green-500/5" : "border-border")
                        }
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{c.author}</span>
                            <span>·</span>
                            <span>{timeAgo(c.ts)}</span>
                            <span className="inline-flex items-center gap-1">
                              <ArrowUp className="w-3 h-3" />
                              {c.votes}
                            </span>
                          </div>
                          {isAccepted && (
                            <StatusBadge tone="success">
                              <CheckCircle2 className="w-3 h-3" />
                              Accepted
                            </StatusBadge>
                          )}
                        </div>
                        <p className="text-sm">{c.body}</p>
                        {detail.type === "Question" && !isAccepted && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAccept(detail, c.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Accept answer
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onAddComment(detail);
                  }}
                />
                <Button onClick={() => onAddComment(detail)} disabled={!comment.trim()}>
                  Comment
                </Button>
              </div>
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default Forum;
