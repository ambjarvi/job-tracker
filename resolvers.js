import { randomUUID } from 'crypto';
import { GraphQLError } from 'graphql';
import { resumes, applications } from './data.js';

export const resolvers = {
  Query: {
    applications: (_, { status }) =>
      status ? applications.filter((a) => a.status === status) : [...applications],

    application: (_, { id }) => applications.find((a) => a.id === id) ?? null,

    resumes: () => [...resumes],

    resume: (_, { id }) => resumes.find((r) => r.id === id) ?? null,
  },

  Application: {
    resume: (app) => resumes.find((r) => r.id === app.resumeId) ?? null,
  },

  Mutation: {
    addApplication: (_, { company, role, url, description = null, status, resumeId }) => {
      if (!resumes.find((r) => r.id === resumeId)) {
        throw new GraphQLError(`Resume with id "${resumeId}" not found`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      const app = {
        id: randomUUID(),
        company,
        role,
        url,
        description,
        status,
        appliedAt: status !== 'WISHLIST' ? new Date().toISOString() : null,
        resumeId,
      };
      applications.push(app);
      return app;
    },

    updateStatus: (_, { id, status }) => {
      const app = applications.find((a) => a.id === id);
      if (!app) return null;
      app.status = status;
      if (status !== 'WISHLIST' && !app.appliedAt) {
        app.appliedAt = new Date().toISOString();
      }
      return app;
    },

    deleteApplication: (_, { id }) => {
      const idx = applications.findIndex((a) => a.id === id);
      if (idx === -1) return false;
      applications.splice(idx, 1);
      return true;
    },

    uploadResume: (_, { name, filePath, fileType }) => {
      const resume = {
        id: randomUUID(),
        name,
        filePath,
        fileType,
        uploadedAt: new Date().toISOString(),
      };
      resumes.push(resume);
      return resume;
    },

    deleteResume: (_, { id }) => {
      if (applications.some((a) => a.resumeId === id)) {
        throw new GraphQLError('Cannot delete resume: it is referenced by one or more applications', {
          extensions: { code: 'CONSTRAINT_VIOLATION' },
        });
      }
      const idx = resumes.findIndex((r) => r.id === id);
      if (idx === -1) return false;
      resumes.splice(idx, 1);
      return true;
    },
  },
};
