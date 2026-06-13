// Package realtime provides a tiny in-process change-notification primitive used to
// drive near-instant dashboard updates without WebSockets.
//
// A single monotonic revision counter is bumped whenever the data changes (a
// middleware bumps it after any successful mutating request). Long-poll clients call
// Wait(since) which blocks until the revision moves past `since` (or the context
// deadline fires), then re-fetch. This is Cloudflare-friendly (plain HTTP, short
// hold), needs no per-handler wiring, and costs ~one parked goroutine per waiting
// client — fine at staff scale.
package realtime

import (
	"context"
	"sync"
)

// Notifier holds the current revision and wakes waiters when it advances.
type Notifier struct {
	mu   sync.Mutex
	rev  uint64
	ch   chan struct{} // closed (and replaced) on every Bump to broadcast to all waiters
}

func New() *Notifier {
	return &Notifier{ch: make(chan struct{})}
}

// Current returns the latest revision.
func (n *Notifier) Current() uint64 {
	n.mu.Lock()
	defer n.mu.Unlock()
	return n.rev
}

// Bump increments the revision and wakes all current waiters.
func (n *Notifier) Bump() {
	n.mu.Lock()
	n.rev++
	old := n.ch
	n.ch = make(chan struct{})
	n.mu.Unlock()
	close(old) // broadcast: every goroutine selecting on `old` unblocks
}

// Wait blocks until the revision is greater than `since`, or ctx is done. It returns
// the current revision and whether a real change occurred (false = ctx timeout/cancel,
// in which case the returned revision is still the latest known value).
func (n *Notifier) Wait(ctx context.Context, since uint64) (uint64, bool) {
	for {
		n.mu.Lock()
		cur := n.rev
		ch := n.ch
		n.mu.Unlock()
		if cur > since {
			return cur, true
		}
		select {
		case <-ch:
			// revision advanced (or another bump); loop re-reads and returns it
		case <-ctx.Done():
			return cur, false
		}
	}
}
