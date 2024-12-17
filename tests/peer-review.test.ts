import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock contract functions
const mockReviews = new Map();
const mockReviewers = new Map();

const mockSubmitReview = vi.fn((proposalId, reviewer, score, comment) => {
  if (!mockReviewers.get(reviewer)) {
    return { type: 'err', value: 403 };
  }
  const key = `${proposalId}-${reviewer}`;
  if (mockReviews.has(key)) {
    return { type: 'err', value: 102 };
  }
  mockReviews.set(key, { score, comment });
  return { type: 'ok', value: true };
});

const mockApproveReviewer = vi.fn((reviewer, caller) => {
  if (caller !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
    return { type: 'err', value: 100 };
  }
  mockReviewers.set(reviewer, true);
  return { type: 'ok', value: true };
});

const mockGetReview = vi.fn((proposalId, reviewer) => {
  const key = `${proposalId}-${reviewer}`;
  const review = mockReviews.get(key);
  return review ? { type: 'ok', value: review } : { type: 'err', value: 404 };
});

const mockGetReviewerStatus = vi.fn((reviewer) => {
  return { type: 'ok', value: { 'is-approved': mockReviewers.get(reviewer) || false } };
});

describe('peer-review contract', () => {
  beforeEach(() => {
    mockReviews.clear();
    mockReviewers.clear();
    vi.clearAllMocks();
  });
  
  describe('submit-review', () => {
    it('should successfully submit a review for an approved reviewer', () => {
      mockApproveReviewer('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      const result = mockSubmitReview(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 8, 'Great proposal!');
      expect(result).toEqual({ type: 'ok', value: true });
    });
    
    it('should fail when submitting a review for a non-approved reviewer', () => {
      const result = mockSubmitReview(1, 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', 8, 'Great proposal!');
      expect(result).toEqual({ type: 'err', value: 403 });
    });
    
    it('should fail when submitting a duplicate review', () => {
      mockApproveReviewer('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      mockSubmitReview(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 8, 'Great proposal!');
      const result = mockSubmitReview(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 9, 'Another review');
      expect(result).toEqual({ type: 'err', value: 102 });
    });
  });
  
  describe('approve-reviewer', () => {
    it('should successfully approve a reviewer when called by contract owner', () => {
      const result = mockApproveReviewer('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      expect(result).toEqual({ type: 'ok', value: true });
    });
    
    it('should fail when called by non-owner', () => {
      const result = mockApproveReviewer('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
      expect(result).toEqual({ type: 'err', value: 100 });
    });
  });
  
  describe('get-review', () => {
    it('should retrieve a submitted review', () => {
      mockApproveReviewer('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      mockSubmitReview(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 8, 'Great proposal!');
      const result = mockGetReview(1, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      expect(result).toEqual({ type: 'ok', value: { score: 8, comment: 'Great proposal!' } });
    });
    
    it('should return an error for non-existent review', () => {
      const result = mockGetReview(999, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      expect(result).toEqual({ type: 'err', value: 404 });
    });
  });
  
  describe('get-reviewer-status', () => {
    it('should return approved status for an approved reviewer', () => {
      mockApproveReviewer('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      const result = mockGetReviewerStatus('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
      expect(result).toEqual({ type: 'ok', value: { 'is-approved': true } });
    });
    
    it('should return not approved status for a non-approved reviewer', () => {
      const result = mockGetReviewerStatus('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
      expect(result).toEqual({ type: 'ok', value: { 'is-approved': false } });
    });
  });
});
