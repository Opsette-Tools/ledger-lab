# Ledger Lab — Guided Lesson Scripts (approved 2026-06-17)

These are the source of truth for the guided-lesson content. The UI is built to
**deliver** these — each lesson follows the same teaching shape:

1. **State the question** up front, before the user clicks.
2. **Narrate what just happened** the instant they click — in plain words,
   sitting right where the action is, NOT in a separate banner across the page.
3. **Hand a one-sentence takeaway.**

**The spine connecting all 5:** cash and accrual only diverge when money and the
delivery of the thing happen at *different* times. Accrual logs the events *in
between* paying and delivering; cash doesn't care about the in-between. Each
lesson steps one notch further from "paid-and-delivered-at-the-same-instant."

No jargon without immediately defining it in plain language ("Accounts
Receivable" → "money I've earned but haven't collected yet").

---

## Lesson 1 — Cash sale (paid AND delivered at the same instant)

**Intro:** Lesson 1: Does it matter how you count a cash sale? A customer walks
in, pays $200 cash, leaves with the goods. Let's see if this simple sale looks
different in cash vs accrual. *You're in Accrual mode. Watch.*
**Action button:** Ring up the $200 sale

**On click (accrual):** You rang up $200. Cash went up $200 — obvious, money's
in hand. And because they paid AND walked out with the goods at the same moment,
you earned it right now — so Revenue went up $200 too. Revenue this month: $200.

**Then:** Now flip to Cash and ring up the same sale → Same result. Cash $200,
Revenue $200.

**Takeaway:** When a customer pays AND gets the thing at the same time, cash and
accrual agree — it doesn't matter which method you use. The methods only diverge
when money and the work happen at *different* times — which is the next lesson.

> ENGINE NOTE: lesson 1 must EARN revenue in both modes. Currently wired to
> `takeDeposit`, which in accrual posts a liability (Customer Deposits) → empty
> revenue chart → looks broken. Use an immediate-sale action that credits Sales
> Revenue in both modes.

---

## Lesson 2 — Invoice (you do the work, money comes later) — accrual divergence begins

**Intro:** Lesson 2: What happens when you bill someone — and wait to get paid?
Last time money and goods changed hands at the same instant. Now they don't: you
send a bill today, they pay in weeks. This is where cash and accrual stop
agreeing. *Accrual mode.*
**Action:** Send Acme a $500 invoice

**On click:** You billed Acme $500 — but no cash has moved. In accrual the sale
counts the moment you EARN it (you did the work + sent the bill), so Revenue went
up $500 even though the bank hasn't changed. The $500 they owe parks in
"Accounts Receivable" = money I've earned but haven't collected yet. Revenue:
$500. Cash: still $0.

**Step 2 — Acme pays the $500:** Now the cash arrives. Cash up $500, and the
"money owed" holding spot drops to $0 — it turned into real cash. Revenue did NOT
change — you already counted it when you billed. The payment just collected what
you'd already earned.

**Takeaway:** In accrual you count the sale when you do the work, not when you get
paid. Money you're owed sits in "Accounts Receivable" until it arrives. Now flip
to Cash and run it again — Cash does the opposite: it ignores the bill entirely
and only counts anything the day the money lands.

---

## Lesson 3 — Deposit (they pay FIRST, you deliver LATER) — the mirror of L2

**Intro:** Lesson 3: What if they pay you BEFORE you've done the work? A customer
hands you $300 up front to hold their spot — but you haven't done anything yet.
Did you just earn $300? Accrual says no. *Accrual mode.*
**Action:** Take a $300 deposit from Beta

**On click:** You've got $300 cash — but haven't earned a penny of it. Cash up
$300, yes. But you still owe Beta the work, so accrual does NOT call it revenue —
it parks it in "Customer Deposits" = money I'm holding that I might have to give
back. It's a debt, not a sale. Cash: $300. Revenue: still $0.

**Step 2 — Do the work:** Now you've earned it. The $300 moves out of "money I
might owe back" and into Revenue $300. Now it's a real sale — because now you've
delivered.

**Takeaway:** Getting paid early isn't the same as earning it. Accrual holds
prepaid money as a kind of debt until you deliver — then it becomes revenue.
This is the exact mirror of Lesson 2: there you earned it before the cash came;
here the cash came before you earned it.

---

## Lesson 4 — Forfeit (they pay, then bail — you keep the deposit, write off the rest)

**Intro:** Lesson 4: They paid a deposit… then cancelled. Now what? The messy
one. Beta gave you a $300 non-refundable deposit and you billed $1,000 for the
full job — then they walk. You keep the deposit but never collect the rest.
*Accrual mode.*
**Action:** Play the whole story (bill $1,000 → take $300 deposit → cancel)

**Narrate each beat:** Billed $1,000 → Revenue $1,000 + $1,000 in "money owed."
Took $300 deposit → held as "money I might owe back." They cancel → two things:
- The $300 is yours now (forfeited) → moves into "Forfeited Deposit Income," an
  earned cancellation fee.
- The other $700 is dead money → you counted it as revenue when you billed, so
  now take it back off: recorded as a loss (a "write-off").
Land: Cash $300, a $300 fee earned, $700 written off. Books balanced.

**Takeaway:** When a deal collapses, accrual makes you undo the revenue you
counted but won't collect (write-off) and recognize the money you keep (forfeit).
Cash mode never had this problem — it never counted the $1,000 in the first place.

---

## Lesson 5 — Prepaid contract (the headline: same money, two stories) — side by side

**Intro:** Lesson 5: The big one. $6,000 up front for 6 months of work. Same
$6,000 either way — but cash and accrual tell wildly different stories. We'll run
it in BOTH and put the two pictures side by side. *Start in Cash mode.*
**Action:** Receive the $6,000

**Cash on click:** Cash mode counts all $6,000 as revenue today. The chart shows
one giant $6,000 spike this month, then five months of $0. On paper you look like
a superstar this month and broke the next five — but nothing really changed, you
just got paid up front.

**Then flip to Accrual, run again:** The $6,000 lands as "Deferred Revenue" =
paid but not earned yet. Revenue this month: $0. Each month you deliver, move
$1,000 into revenue. Play 6 months → six smooth $1,000 bars instead of one spike.

**Takeaway (show both charts side by side):** Same $6,000, same business — Cash
shows one huge spike + five dead months; Accrual shows steady, honest $1,000/mo.
THIS is why the method matters: accrual spreads the money across the months you
actually do the work, so the books reflect reality instead of just following the
bank account.

---

## Build notes
- The narration must render WHERE THE ACTION IS (inline with the lesson), not in
  the separate top "What just happened" banner. That banner concept is retired
  for the Learn tab.
- Big welcome blurb should be dismissible.
- "Play all" only shows on multi-step lessons.
- Lessons must read the CURRENT method live and never auto-switch it; tip text
  may suggest a method but the user owns the toggle.
- Revenue chart is part of the lesson surface (it's the payoff for L1/L5), not a
  disconnected side card.
