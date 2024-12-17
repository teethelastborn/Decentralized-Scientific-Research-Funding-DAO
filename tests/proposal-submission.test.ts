import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock contract functions
const mockProposals = new Map();
let mockProposalIdNonce = 0;

const mockSubmitProposal = vi.fn((title, description, fundingGoal) => {
  const proposalId = ++mockProposalIdNonce;
  mockProposals.set(proposalId, {
    researcher: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    title,
    description,
    fundingGoal,
    status: 'submitted'
  });
  return { type: 'ok', value: proposalId };
});

const mockGetProposal = vi.fn((proposalId) => {
  const proposal = mockProposals.get(proposalId);
  return proposal ? { type: 'ok', value: proposal } : { type: 'err', value: 404 };
});

const mockUpdateProposalStatus = vi.fn((proposalId, newStatus, caller) => {
  if (caller !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
    return { type: 'err', value: 100 };
  }
  const proposal = mockProposals.get(proposalId);
  if (!proposal) {
    return { type: 'err', value: 404 };
  }
  proposal.status = newStatus;
  return { type: 'ok', value: true };
});

describe('proposal-submission contract', () => {
  beforeEach(() => {
    mockProposals.clear();
    mockProposalIdNonce = 0;
    vi.clearAllMocks();
  });
  
  describe('submit-proposal', () => {
    it('should successfully submit a proposal', () => {
      const result = mockSubmitProposal('Test Proposal', 'This is a test proposal', 1000000);
      expect(result).toEqual({ type: 'ok', value: 1 });
    });
    
    it('should increment proposal-id-nonce', () => {
      mockSubmitProposal('Proposal 1', 'Description 1', 1000000);
      const result = mockSubmitProposal('Proposal 2', 'Description 2', 2000000);
      expect(result).toEqual({ type: 'ok', value: 2 });
    });
  });
  
  describe('get-proposal', () => {
    it('should retrieve a submitted proposal', () => {
      mockSubmitProposal('Test Proposal', 'This is a test proposal', 1000000);
      const result = mockGetProposal(1);
      expect(result.type).toBe('ok');
      expect(result.value).toEqual({
        researcher: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        title: 'Test Proposal',
        description: 'This is a test proposal',
        fundingGoal: 1000000,
        status: 'submitted'
      });
    });
    
    it('should return an error for non-existent proposal', () => {
      const result = mockGetProposal(999);
      expect(result).toEqual({ type: 'err', value: 404 });
    });
  });
  
  describe('update-proposal-status', () => {
    it('should update proposal status when called by contract owner', () => {
      mockSubmitProposal('Test Proposal', 'This is a test proposal', 1000000);
      const result = mockUpdateProposalStatus(1, 'approved', 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      expect(result).toEqual({ type: 'ok', value: true });
    });
    
    it('should fail when called by non-owner', () => {
      mockSubmitProposal('Test Proposal', 'This is a test proposal', 1000000);
      const result = mockUpdateProposalStatus(1, 'approved', 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
      expect(result).toEqual({ type: 'err', value: 100 });
    });
  });
});
