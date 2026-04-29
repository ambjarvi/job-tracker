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
  mutation CreateApplication(
    $company: String!
    $role: String!
    $url: String
    $description: String
    $status: ApplicationStatus!
    $resumeId: ID
  ) {
    addApplication(
      company: $company
      role: $role
      url: $url
      description: $description
      status: $status
      resumeId: $resumeId
    ) {
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
    updateStatus(id: $id, status: $status) {
      id
      status
    }
  }
`

export const UPLOAD_RESUME_FILE = gql`
  mutation UploadResumeFile($name: String!, $file: Upload!, $fileType: FileType!) {
    uploadResumeFile(name: $name, file: $file, fileType: $fileType) {
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

export const UPDATE_APPLICATION = gql`
  mutation UpdateApplication(
    $id: ID!
    $company: String
    $role: String
    $url: String
    $description: String
    $status: ApplicationStatus
    $resumeId: ID
  ) {
    updateApplication(
      id: $id
      company: $company
      role: $role
      url: $url
      description: $description
      status: $status
      resumeId: $resumeId
    ) {
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

export const DELETE_APPLICATION = gql`
  mutation DeleteApplication($id: ID!) {
    deleteApplication(id: $id)
  }
`

export const TAILOR_RESUME = gql`
  mutation TailorResume($applicationId: ID!, $resumeId: ID!) {
    tailorResume(applicationId: $applicationId, resumeId: $resumeId) {
      resumeId
      applicationId
      tailoredResume
      changes
      suggestions
    }
  }
`
