import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock contract functions
const mockVotes = new Map();
const mockProposalVotes = new Map();

const mockVote = vi.fn((proposalId, voter, amount) => {
  if (mockVotes.has(`${proposalId}-${voter}`)) {
    return { type: 'err', value: 102 };
  }
  mockVotes.set(`${proposalId}-${voter}`, { amount });
  const totalVotes = (mockProposalVotes.get(proposalId) || 0) + amount;
  mockProposalVotes.set(proposalId, totalVotes);
  return { type: 'ok', value: true };
});

const mockGetVotes = vi.fn((proposalId) => {
  const totalVotes = mockProposalVotes.get(proposalId);
  return totalVotes !== undefined ? { type: 'ok', value: { 'total-votes': totalVotes } } : { type: 'err', value: 404 };
});

const mockGetVoterInfo = vi.fn((proposalId, voter) => {
  const vote = mockVotes.get(`${proposalId}-${voter}`);
  return vote ? { type: 'ok', value: vote } : { type: 'err', value: 404 };
});

describe('voting contract', () => {
  beforeEach(() => {
    mockVotes.clear();
    mockProposalVotes.clear();
    vi.clearAllMocks();
  });
  
  describe('vote', () => {
    it('should successfully cast a vote', () => {
      const result = mockVote(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 100);
      expect(result).toEqual({ type: 'ok', value: true });
    });
    
    it('should fail when voting twice for the same proposal', () => {
      mockVote(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 100);
      const result = mockVote(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 50);
      expect(result).toEqual({ type: 'err', value: 102 });
    });
  });
  
  describe('get-votes', () => {
    it('should retrieve the total votes for a proposal', () => {
      mockVote(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 100);
      const result = mockGetVotes(1);
      expect(result).toEqual({ type: 'ok', value: { 'total-votes': 100 } });
    });
    
    it('should return an error for a non-existent proposal', () => {
      const result = mockGetVotes(999);
      expect(result).toEqual({ type: 'err', value: 404 });
    });
  });
  
  describe('get-voter-info', () => {
    it('should retrieve voter information for a specific proposal', () => {
      mockVote(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 100);
      const result = mockGetVoterInfo(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      expect(result).toEqual({ type: 'ok', value: { amount: 100 } });
    });
    
    it('should return an error for a non-existent vote', () => {
      const result = mockGetVoterInfo(999, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      expect(result).toEqual({ type: 'err', value: 404 });
    });
  });
});
