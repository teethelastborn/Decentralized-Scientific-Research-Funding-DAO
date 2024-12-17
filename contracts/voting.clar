;; Voting Contract

(define-constant err-not-found (err u101))
(define-constant err-already-voted (err u102))

(define-fungible-token dao-token)

(define-map votes
  { proposal-id: uint, voter: principal }
  { amount: uint }
)

(define-map proposal-votes
  { proposal-id: uint }
  { total-votes: uint }
)

(define-public (vote (proposal-id uint) (amount uint))
  (let
    (
      (proposal (unwrap! (contract-call? .proposal-submission get-proposal proposal-id) (err u404)))
      (current-votes (default-to { total-votes: u0 } (map-get? proposal-votes { proposal-id: proposal-id })))
    )
    (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: tx-sender })) err-already-voted)
    (try! (ft-transfer? dao-token amount tx-sender (as-contract tx-sender)))
    (map-set votes
      { proposal-id: proposal-id, voter: tx-sender }
      { amount: amount }
    )
    (map-set proposal-votes
      { proposal-id: proposal-id }
      { total-votes: (+ (get total-votes current-votes) amount) }
    )
    (ok true)
  )
)

(define-read-only (get-votes (proposal-id uint))
  (ok (unwrap! (map-get? proposal-votes { proposal-id: proposal-id }) (err u404)))
)

(define-read-only (get-voter-info (proposal-id uint) (voter principal))
  (ok (unwrap! (map-get? votes { proposal-id: proposal-id, voter: voter }) (err u404)))
)

