import { describe, it, expect } from 'vitest';
import { parseTaskFromBranch, parseTasksFromCommit, parseRemoteUrl } from '../git.js';

// ---------------------------------------------------------------------------
// parseTaskFromBranch
// ---------------------------------------------------------------------------
describe('parseTaskFromBranch', () => {
  describe('Pattern 1: PROJECT-123 format', () => {
    it('extracts key and number from feature branch', () => {
      expect(parseTaskFromBranch('feature/PROJ-123-add-login')).toEqual({
        key: 'PROJ',
        number: 123,
      });
    });

    it('extracts key and number from bugfix branch', () => {
      expect(parseTaskFromBranch('bugfix/PROJ-456')).toEqual({
        key: 'PROJ',
        number: 456,
      });
    });

    it('extracts key and number when branch name is just the reference', () => {
      expect(parseTaskFromBranch('PROJ-789')).toEqual({
        key: 'PROJ',
        number: 789,
      });
    });

    it('handles multi-letter project keys', () => {
      expect(parseTaskFromBranch('feature/ICEBERG-42-deep-feature')).toEqual({
        key: 'ICEBERG',
        number: 42,
      });
    });

    it('matches the first occurrence when multiple references exist', () => {
      expect(parseTaskFromBranch('feature/AB-1-refs-CD-2')).toEqual({
        key: 'AB',
        number: 1,
      });
    });

    it('ignores projectKey argument when PROJECT-123 pattern matches', () => {
      expect(parseTaskFromBranch('feature/PROJ-10-desc', 'OTHER')).toEqual({
        key: 'PROJ',
        number: 10,
      });
    });
  });

  describe('Pattern 2: bare number with projectKey', () => {
    it('extracts number and uses provided projectKey', () => {
      expect(parseTaskFromBranch('123-description', 'PROJ')).toEqual({
        key: 'PROJ',
        number: 123,
      });
    });

    it('extracts first numeric segment from branch path', () => {
      expect(parseTaskFromBranch('feature/99-quick-fix', 'LTF')).toEqual({
        key: 'LTF',
        number: 99,
      });
    });
  });

  describe('returns null', () => {
    it('returns null for branch with no task reference and no projectKey', () => {
      expect(parseTaskFromBranch('main')).toBeNull();
    });

    it('returns null for branch with no digits and no projectKey', () => {
      expect(parseTaskFromBranch('feature/add-login')).toBeNull();
    });

    it('returns null for bare number without projectKey', () => {
      expect(parseTaskFromBranch('123-description')).toBeNull();
    });

    it('returns null for lowercase project prefix (no uppercase match)', () => {
      expect(parseTaskFromBranch('proj-123-stuff')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseTaskFromBranch('')).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// parseTasksFromCommit
// ---------------------------------------------------------------------------
describe('parseTasksFromCommit', () => {
  describe('PROJECT-123 pattern', () => {
    it('finds a single PROJECT-123 reference', () => {
      expect(parseTasksFromCommit('fix: resolve PROJ-42 login issue')).toEqual([
        { key: 'PROJ', number: 42 },
      ]);
    });

    it('finds multiple PROJECT-123 references', () => {
      expect(
        parseTasksFromCommit('feat: implement PROJ-1 and PROJ-2')
      ).toEqual([
        { key: 'PROJ', number: 1 },
        { key: 'PROJ', number: 2 },
      ]);
    });

    it('finds references across different projects', () => {
      expect(
        parseTasksFromCommit('merge: ALPHA-10 depends on BETA-20')
      ).toEqual([
        { key: 'ALPHA', number: 10 },
        { key: 'BETA', number: 20 },
      ]);
    });

    it('handles "fixes PROJECT-123" prefix', () => {
      expect(parseTasksFromCommit('fixes PROJ-99')).toEqual([
        { key: 'PROJ', number: 99 },
      ]);
    });

    it('handles "refs PROJECT-123" prefix', () => {
      expect(parseTasksFromCommit('refs PROJ-7')).toEqual([
        { key: 'PROJ', number: 7 },
      ]);
    });
  });

  describe('#123 pattern with projectKey', () => {
    it('finds #123 references when projectKey is provided', () => {
      expect(
        parseTasksFromCommit('closes #55 and #66', 'LTF')
      ).toEqual([
        { key: 'LTF', number: 55 },
        { key: 'LTF', number: 66 },
      ]);
    });

    it('combines PROJECT-123 and #123 references', () => {
      expect(
        parseTasksFromCommit('fix PROJ-10 see also #20', 'PROJ')
      ).toEqual([
        { key: 'PROJ', number: 10 },
        { key: 'PROJ', number: 20 },
      ]);
    });

    it('deduplicates when #N matches an existing PROJECT-N number', () => {
      const result = parseTasksFromCommit('PROJ-5 and #5', 'PROJ');
      expect(result).toEqual([{ key: 'PROJ', number: 5 }]);
    });

    it('ignores #123 patterns when projectKey is not provided', () => {
      expect(parseTasksFromCommit('closes #55')).toEqual([]);
    });
  });

  describe('returns empty array', () => {
    it('returns empty array for message with no references', () => {
      expect(parseTasksFromCommit('chore: update dependencies')).toEqual([]);
    });

    it('returns empty array for empty string', () => {
      expect(parseTasksFromCommit('')).toEqual([]);
    });

    it('returns empty array for lowercase project prefix', () => {
      expect(parseTasksFromCommit('fix proj-123')).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// parseRemoteUrl
// ---------------------------------------------------------------------------
describe('parseRemoteUrl', () => {
  describe('HTTPS URLs', () => {
    it('parses GitHub HTTPS URL with .git suffix', () => {
      expect(
        parseRemoteUrl('https://github.com/octocat/hello-world.git')
      ).toEqual({
        owner: 'octocat',
        repo: 'hello-world',
        provider: 'github',
      });
    });

    it('parses GitHub HTTPS URL without .git suffix', () => {
      expect(
        parseRemoteUrl('https://github.com/octocat/hello-world')
      ).toEqual({
        owner: 'octocat',
        repo: 'hello-world',
        provider: 'github',
      });
    });

    it('detects GitLab provider from HTTPS URL', () => {
      expect(
        parseRemoteUrl('https://gitlab.com/group/project.git')
      ).toEqual({
        owner: 'group',
        repo: 'project',
        provider: 'gitlab',
      });
    });

    it('detects Bitbucket provider from HTTPS URL', () => {
      expect(
        parseRemoteUrl('https://bitbucket.org/team/repo.git')
      ).toEqual({
        owner: 'team',
        repo: 'repo',
        provider: 'bitbucket',
      });
    });

    it('parses http:// (non-TLS) URL', () => {
      expect(
        parseRemoteUrl('http://github.com/user/repo.git')
      ).toEqual({
        owner: 'user',
        repo: 'repo',
        provider: 'github',
      });
    });
  });

  describe('SSH URLs', () => {
    it('parses GitHub SSH URL with .git suffix', () => {
      expect(
        parseRemoteUrl('git@github.com:octocat/hello-world.git')
      ).toEqual({
        owner: 'octocat',
        repo: 'hello-world',
        provider: 'github',
      });
    });

    it('parses GitHub SSH URL without .git suffix', () => {
      expect(
        parseRemoteUrl('git@github.com:octocat/hello-world')
      ).toEqual({
        owner: 'octocat',
        repo: 'hello-world',
        provider: 'github',
      });
    });

    it('detects GitLab provider from SSH URL', () => {
      expect(
        parseRemoteUrl('git@gitlab.com:group/project.git')
      ).toEqual({
        owner: 'group',
        repo: 'project',
        provider: 'gitlab',
      });
    });

    it('detects Bitbucket provider from SSH URL', () => {
      expect(
        parseRemoteUrl('git@bitbucket.org:team/repo.git')
      ).toEqual({
        owner: 'team',
        repo: 'repo',
        provider: 'bitbucket',
      });
    });
  });

  describe('returns null for invalid URLs', () => {
    it('returns null for empty string', () => {
      expect(parseRemoteUrl('')).toBeNull();
    });

    it('returns null for plain text', () => {
      expect(parseRemoteUrl('not-a-url')).toBeNull();
    });

    it('returns null for URL missing owner/repo path', () => {
      expect(parseRemoteUrl('https://github.com')).toBeNull();
    });

    it('returns null for URL with only owner', () => {
      expect(parseRemoteUrl('https://github.com/owner')).toBeNull();
    });
  });
});
