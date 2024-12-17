;; Proposal Submission Contract

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-exists (err u102))

(define-data-var proposal-id-nonce uint u0)

(define-map proposals
  { proposal-id: uint }
  {
    researcher: principal,
    title: (string-utf8 100),
    description: (string-utf8 1000),
    funding-goal: uint,
    status: (string-ascii 20)
  }
)

(define-public (submit-proposal (title (string-utf8 100)) (description (string-utf8 1000)) (funding-goal uint))
  (let
    (
      (proposal-id (+ (var-get proposal-id-nonce) u1))
    )
    (var-set proposal-id-nonce proposal-id)
    (map-set proposals
      { proposal-id: proposal-id }
      {
        researcher: tx-sender,
        title: title,
        description: description,
        funding-goal: funding-goal,
        status: "submitted"
      }
    )
    (ok proposal-id)
  )
)

(define-read-only (get-proposal (proposal-id uint))
  (ok (unwrap! (map-get? proposals { proposal-id: proposal-id }) (err u404)))
)

(define-public (update-proposal-status (proposal-id uint) (new-status (string-ascii 20)))
  (let
    (
      (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) (err u404)))
    )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal { status: new-status })
    ))
  )
)

