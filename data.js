export const resumes = [
  {
    id: '1',
    name: 'SWE Resume v2',
    filePath: '/uploads/swe-resume-v2.pdf',
    fileType: 'PDF',
    uploadedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: '2',
    name: 'Frontend Specialist Resume',
    filePath: '/uploads/frontend-resume.docx',
    fileType: 'DOCX',
    uploadedAt: '2026-02-10T14:30:00.000Z',
  },
];

export const applications = [
  {
    id: '1',
    company: 'Stripe',
    role: 'Software Engineer',
    url: 'https://stripe.com/jobs/listing/swe',
    description: 'Backend infrastructure team',
    status: 'APPLIED',
    appliedAt: '2026-03-01T10:00:00.000Z',
    resumeId: '1',
  },
  {
    id: '2',
    company: 'Vercel',
    role: 'Frontend Engineer',
    url: 'https://vercel.com/careers/frontend-engineer',
    description: null,
    status: 'INTERVIEWING',
    appliedAt: '2026-02-20T11:00:00.000Z',
    resumeId: '2',
  },
  {
    id: '3',
    company: 'Linear',
    role: 'Full Stack Engineer',
    url: 'https://linear.app/careers/fullstack',
    description: 'Product team, building core features',
    status: 'WISHLIST',
    appliedAt: null,
    resumeId: '1',
  },
];
