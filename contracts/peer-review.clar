;; Peer Review Contract

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-reviewed (err u102))

(define-map reviews
  { proposal-id: uint, reviewer: principal }
  { score: uint, comment: (string-utf8 500) }
)

(define-map reviewers
  { reviewer: principal }
  { is-approved: bool }
)

(define-public (submit-review (proposal-id uint) (score uint) (comment (string-utf8 500)))
  (let
    (
      (reviewer-status (default-to { is-approved: false } (map-get? reviewers { reviewer: tx-sender })))
    )
    (asserts! (get is-approved reviewer-status) (err u403))
    (asserts! (is-none (map-get? reviews { proposal-id: proposal-id, reviewer: tx-sender })) err-already-reviewed)
    (ok (map-set reviews
      { proposal-id: proposal-id, reviewer: tx-sender }
      { score: score, comment: comment }
    ))
  )
)

(define-public (approve-reviewer (reviewer principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (map-set reviewers { reviewer: reviewer } { is-approved: true }))
  )
)

(define-read-only (get-review (proposal-id uint) (reviewer principal))
  (ok (unwrap! (map-get? reviews { proposal-id: proposal-id, reviewer: reviewer }) (err u404)))
)

(define-read-only (get-reviewer-status (reviewer principal))
  (ok (default-to { is-approved: false } (map-get? reviewers { reviewer: reviewer })))
)

