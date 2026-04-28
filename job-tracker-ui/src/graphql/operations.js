import { gql } from '@apollo/client/core'

export const GET_APPLICATIONS = gql`
  query GetApplications {
    applications {
      id
      company
      role
      url
      description
      status
      appliedAt
      resume {
        id
        name
      }
    }
  }
`

export const GET_RESUMES = gql`
  query GetResumes {
    resumes {
      id
      name
      fileType
      uploadedAt
      applications {
        id
      }
    }
  }
`

export const CREATE_APPLICATION = gql`
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) {
      id
      company
      role
      url
      description
      status
      appliedAt
      resume {
        id
        name
      }
    }
  }
`

export const UPDATE_APPLICATION_STATUS = gql`
  mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {
    updateApplication(id: $id, input: { status: $status }) {
      id
      status
    }
  }
`

export const TAILOR_RESUME = gql`
  mutation TailorResume($applicationId: ID!, $resumeId: ID!) {
    tailorResume(applicationId: $applicationId, resumeId: $resumeId) {
      tailoredResume
      suggestions
    }
  }
`
