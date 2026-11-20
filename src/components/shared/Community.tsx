"use client";
import { useState } from "react";
import { notifyCase } from "@/lib/notify";
import { addPost, deletePost, editPost, getPosts, useLive, useLoad, type Member, type Post } from "@/lib/cloud";
import { maskSensitive } from "@/lib/analyze";
import { Alert, Badge, Btn, Empty, Field, Loading, Panel, Section, SelectField, TextBtn, inputCls, runBusy } from "@/components/ui";

const when = (t: string) => new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function Community({ caseId, uid, role, myName }: { caseId: string; uid: string; role: Member["role"]; myName: string }) {
  const posts = useLoad(() => getPosts(caseId), [caseId]);
  useLive(caseId, ["posts"], posts.reload);
  const canWrite = role !== "viewer";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sort, setSort] = useState("new");
  const [open, setOpen] = useState<string | null>(null);

  const all = posts.data || [];
  const roots = all.filter((p) => !p.parent_id).sort((a, b) => {
    if (sort === "active") {
      const la = Math.max(+new Date(a.created_at), ...all.filter((r) => r.parent_id === a.id).map((r) => +new Date(r.created_at)));
      const lb = Math.max(+new Date(b.created_at), ...all.filter((r) => r.parent_id === b.id).map((r) => +new Date(r.created_at)));
      return lb - la;
    }
    return b.created_at.localeCompare(a.created_at);
  });

  const submit = () => {
    setErr(null);
    if (!body.trim()) { setErr("내용을 입력해 주세요."); return; }
    runBusy("글 올리는 중", async () => {
      try { await addPost({ case_id: caseId, author_name: myName, title, body: maskSensitive(body) }); void notifyCase(caseId, `${myName}님이 새 글을 올렸습니다`, (title || body).slice(0, 80), "community"); setTitle(""); setBody(""); posts.reload(); }
      catch (e) { setErr(e instanceof Error ? e.message : "올리지 못했습니다."); }
    });
  };

  return (
    <>
      <Section title="글쓰기" desc="휴대폰·주민등록번호는 자동으로 가립니다" kicker="WRITE">
        {canWrite ? (
          <Panel>
            <Field label="제목 (선택)"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className={inputCls} placeholder="예) 다음 주 임시총회 같이 가실 분" /></Field>
            <Field label="내용" required error={err && !body.trim() ? err : undefined}>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={5000} className={`${inputCls} min-h-[104px] resize-y leading-relaxed`} placeholder="사건과 관련된 소식·의견을 나눠 주세요." />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <span className="t-meta">{body.length}/5000</span>
              <Btn onClick={submit}>글 올리기</Btn>
            </div>
          </Panel>
        ) : <Alert tone="info" title="열람 권한">지금 권한은 ‘열람만’이라 글을 쓸 수 없습니다. 글을 쓰려면 사건 주인에게 ‘작성 가능’ 권한을 요청하세요.</Alert>}
        {err && body.trim() && <Alert tone="danger" title="올리기 실패">{err}</Alert>}
      </Section>

      <Section title="이야기 목록" desc="새 글·댓글은 바로 반영됩니다" kicker="THREADS">
        <div className="max-w-[260px]">
          <SelectField label="정렬" value={sort} onChange={setSort} options={[{ value: "new", label: "새 글 순" }, { value: "active", label: "최근 댓글 순" }]} />
        </div>
        {posts.loading && !posts.data ? <Loading>글 불러오는 중</Loading>
          : posts.error ? <Alert tone="danger" title="불러오기 실패">{posts.error}</Alert>
          : roots.length === 0 ? <Empty>아직 글이 없습니다. 첫 글을 남겨 보세요.</Empty>
          : (
            <div className="grid gap-3.5">
              {roots.map((p) => (
                <Thread key={p.id} p={p} replies={all.filter((r) => r.parent_id === p.id)} uid={uid} role={role} myName={myName} caseId={caseId}
                  open={open === p.id} toggle={() => setOpen(open === p.id ? null : p.id)} reload={posts.reload} />
              ))}
            </div>
          )}
      </Section>
    </>
  );
}

function Thread({ p, replies, uid, role, myName, caseId, open, toggle, reload }: { p: Post; replies: Post[]; uid: string; role: Member["role"]; myName: string; caseId: string; open: boolean; toggle: () => void; reload: () => void }) {
  const [reply, setReply] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const canWrite = role !== "viewer";
  const send = () => {
    if (!reply.trim()) return;
    runBusy("댓글 다는 중", async () => {
      try { await addPost({ case_id: caseId, parent_id: p.id, author_name: myName, body: maskSensitive(reply) }); void notifyCase(caseId, `${myName}님이 댓글을 남겼습니다`, reply.slice(0, 80), "community"); setReply(""); reload(); }
      catch (e) { setErr(e instanceof Error ? e.message : "올리지 못했습니다."); }
    });
  };
  return (
    <Panel>
      <PostBody p={p} uid={uid} role={role} reload={reload} />
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <TextBtn onClick={toggle}>{open ? "댓글 접기" : `댓글 ${replies.length}개 ${replies.length ? "보기" : "달기"}`}</TextBtn>
      </div>
      {open && (
        <div className="mt-3 space-y-3 border-l-2 border-line pl-3">
          {replies.map((r) => <PostBody key={r.id} p={r} uid={uid} role={role} reload={reload} small />)}
          {canWrite && (
            <div className="flex items-end gap-2">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={1} maxLength={2000} aria-label="댓글"
                className={`${inputCls} h-11 min-h-11 flex-1 resize-none leading-snug`} placeholder="댓글 입력" />
              <Btn kind="secondary" onClick={send} disabled={!reply.trim()}>댓글</Btn>
            </div>
          )}
          {err && <Alert tone="danger" title="실패">{err}</Alert>}
        </div>
      )}
    </Panel>
  );
}

function PostBody({ p, uid, role, reload, small }: { p: Post; uid: string; role: Member["role"]; reload: () => void; small?: boolean }) {
  const mine = p.author_id === uid;
  const [editing, setEditing] = useState(false);
  const [t, setT] = useState(p.title || "");
  const [b, setB] = useState(p.body);
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const long = p.body.length > 280;
  const save = () => {
    if (!b.trim()) { setErr("내용을 입력해 주세요."); return; }
    runBusy("글 고치는 중", async () => {
      try { await editPost(p.id, { title: small ? null : t.trim() || null, body: maskSensitive(b) }); setEditing(false); setErr(null); reload(); }
      catch (e) { setErr(e instanceof Error ? e.message : "고치지 못했습니다."); }
    });
  };
  const del = () => runBusy("지우는 중", async () => {
    try { await deletePost(p.id); reload(); } catch (e) { setErr(e instanceof Error ? e.message : "지우지 못했습니다."); }
  });
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        <b className={small ? "t-label" : "t-title"}>{p.author_name}</b>
        {mine && <Badge tone="blue">나</Badge>}
        {p.edited && <Badge tone="gray">수정됨</Badge>}
        <span className="t-meta">{when(p.created_at)}{p.edited ? ` · 수정 ${when(p.updated_at)}` : ""}</span>
      </div>
      {editing ? (
        <div className="mt-2">
          {!small && <input value={t} onChange={(e) => setT(e.target.value)} maxLength={100} className={`${inputCls} mb-2`} placeholder="제목 (선택)" aria-label="제목 고치기" />}
          <textarea value={b} onChange={(e) => setB(e.target.value)} rows={4} maxLength={5000} className={`${inputCls} resize-y`} aria-label="내용 고치기" />
          <div className="mt-2 flex gap-[9px]"><Btn kind="secondary" onClick={save}>고친 내용 저장</Btn><Btn kind="ghost" onClick={() => { setEditing(false); setT(p.title || ""); setB(p.body); }}>취소</Btn></div>
        </div>
      ) : (
        <>
          {p.title && !small && <p className="t-title mt-1.5">{p.title}</p>}
          <p className={`t-body mt-1 whitespace-pre-wrap break-words ${long && !more ? "line-clamp-6" : ""}`}>{p.body}</p>
          {long && <TextBtn tone="muted" onClick={() => setMore(!more)}>{more ? "접기" : "더 보기"}</TextBtn>}
        </>
      )}
      {!editing && (mine || role === "owner") && (
        <div className="mt-1.5 flex gap-3">
          {mine && role !== "viewer" && <TextBtn tone="muted" onClick={() => setEditing(true)}>수정</TextBtn>}
          {confirm ? <><TextBtn tone="danger" onClick={del}>정말 삭제</TextBtn><TextBtn tone="muted" onClick={() => setConfirm(false)}>취소</TextBtn></>
            : <TextBtn tone="danger" onClick={() => setConfirm(true)}>{mine ? "삭제" : "삭제(주인)"}</TextBtn>}
        </div>
      )}
      {err && <Alert tone="danger" title="확인 필요">{err}</Alert>}
    </div>
  );
}
