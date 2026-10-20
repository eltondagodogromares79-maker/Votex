"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { useNotificationActions, useNotifications } from "../hooks/useNotifications";

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function NotificationInbox() {
  const pageSize = 30;
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError, refetch } = useNotifications(pageSize, offset);
  const { markRead, markAllRead } = useNotificationActions();

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-small text-muted">Your account notifications and updates.</p>
          {!isLoading && data && <p className="mt-1 text-caption text-muted">{data.unreadCount} unread · {data.total} total</p>}
        </div>
        {!!data?.unreadCount && (
          <Button variant="ghost" size="sm" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse bg-surface" />)}</div>
      ) : isError ? (
        <div className="border border-error/20 bg-surface px-6 py-10 text-center">
          <p className="text-small text-error">Notifications could not be loaded.</p>
          <button onClick={() => refetch()} className="mt-3 text-small font-semibold text-navy underline">Try again</button>
        </div>
      ) : !data?.items.length ? (
        <div className="border border-border bg-surface px-6 py-14 text-center">
          <span aria-hidden="true" className="text-3xl text-gold">♧</span>
          <h2 className="mt-3 font-serif text-h3 font-bold text-charcoal">You’re all caught up</h2>
          <p className="mt-2 text-small text-muted">New assignments and account updates will appear here.</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border border border-border bg-surface">
            {data.items.map((notification) => {
              const content = (
                <>
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.readAt ? "bg-border" : "bg-gold"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-charcoal">{notification.title}</span>
                      {!notification.readAt && <span className="bg-gold/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-navy">New</span>}
                    </span>
                    <span className="mt-1 block text-small leading-relaxed text-muted">{notification.message}</span>
                    <time dateTime={notification.createdAt} className="mt-2 block text-caption text-muted/80">{dateTime(notification.createdAt)}</time>
                  </span>
                </>
              );
              return (
                <li key={notification.id}>
                  {notification.href ? (
                    <Link href={notification.href} onClick={() => { if (!notification.readAt) markRead.mutate(notification.id); }} className="flex gap-3 px-4 py-5 transition-colors hover:bg-slate/70 sm:px-6">
                      {content}
                    </Link>
                  ) : (
                    <div className="flex gap-3 px-4 py-5 sm:px-6">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {data.total > pageSize && (
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="sm" disabled={offset === 0} onClick={() => setOffset((value) => Math.max(0, value - pageSize))}>Previous</Button>
              <span className="text-caption text-muted">{offset + 1}–{Math.min(offset + pageSize, data.total)} of {data.total}</span>
              <Button variant="ghost" size="sm" disabled={offset + pageSize >= data.total} onClick={() => setOffset((value) => value + pageSize)}>Next</Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
