export const typeDefs = `#graphql
  scalar Upload

  enum ApplicationStatus {
    WISHLIST
    APPLIED
    INTERVIEWING
    OFFERED
    REJECTED
  }

  enum FileType {
    PDF
    DOCX
  }

  type Resume {
    id: ID!
    name: String!
    filePath: String!
    fileType: FileType!
    uploadedAt: String!
    applications: [Application!]!
  }

  type Application {
    id: ID!
    company: String!
    role: String!
    url: String
    description: String
    status: ApplicationStatus!
    appliedAt: String
    resumeId: ID
    resume: Resume
  }

  type Query {
    applications(status: ApplicationStatus): [Application!]!
    application(id: ID!): Application
    resumes: [Resume!]!
    resume(id: ID!): Resume
  }

  type TailoringResult {
    resumeId: ID!
    applicationId: ID!
    suggestions: String!
  }

  type Mutation {
    addApplication(
      company: String!
      role: String!
      url: String
      description: String
      status: ApplicationStatus!
      resumeId: ID
    ): Application!

    updateStatus(id: ID!, status: ApplicationStatus!): Application

    deleteApplication(id: ID!): Boolean!

    uploadResume(
      name: String!
      filePath: String!
      fileType: FileType!
    ): Resume!

    uploadResumeFile(
      name: String!
      file: Upload!
      fileType: FileType!
    ): Resume!

    deleteResume(id: ID!): Boolean!

    tailorResume(resumeId: ID!, applicationId: ID!): TailoringResult!
  }
`
