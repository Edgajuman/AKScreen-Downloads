import unittest
from validate_publish import approved, PLATFORMS


class PublicationGuard(unittest.TestCase):
    def setUp(self):
        self.run = dict(id=44, path='.github/workflows/build.yml', event='workflow_dispatch', status='in_progress', conclusion=None)
        self.jobs = [dict(name=n, status='completed', conclusion='success') for n in PLATFORMS]

    def test_all_four_platforms_allow_own_automatic_publication(self):
        self.assertTrue(approved(self.run, self.jobs, 44))

    def test_failed_missing_running_duplicate_and_foreign_builds_are_refused(self):
        self.assertFalse(approved(self.run, self.jobs[:-1], 44))
        self.assertFalse(approved(self.run, self.jobs, 45))
        for status, conclusion in [('completed', 'failure'), ('in_progress', None), ('completed', 'skipped')]:
            self.assertFalse(approved(self.run, [*self.jobs[:-1], dict(self.jobs[-1], status=status, conclusion=conclusion)], 44))
        self.assertFalse(approved(self.run, [self.jobs[0]] * 4, 44))
        self.assertFalse(approved(dict(self.run, path='other.yml'), self.jobs, 44))

    def test_manual_publication_requires_completed_success(self):
        self.assertFalse(approved(self.run))
        self.assertTrue(approved(dict(self.run, status='completed', conclusion='success')))
        self.assertFalse(approved(dict(self.run, status='completed', conclusion='failure')))
