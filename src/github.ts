export const query = `
  query($cursor: String) {
    viewer {
      starredRepositories(first: 5, after: $cursor, orderBy: { field: STARRED_AT, direction: DESC }) {
        totalCount
        pageInfo {
          startCursor
          hasPreviousPage
          endCursor
          hasNextPage
        }
        nodes {
          description
          languages(first: 100) {
            nodes {
              id
              name
            }
          }
          licenseInfo {
            spdxId
          }
          name
          owner {
            avatarUrl
            login
            url
          }
          primaryLanguage {
            id
            name
          }
          releases(first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
            nodes {
              descriptionHTML
              id
              isDraft
              isPrerelease
              name
              publishedAt
              url
            }
          }
          stargazerCount
          url
        }
      }
    }

    rateLimit {
      cost
      limit
      remaining
      used
      resetAt
    }
  }
`

export interface GithubRelease {
  descriptionHTML: string
  id: string
  isDraft: boolean
  isPrerelease: boolean
  name: string
  publishedAt: string
  url: string
}

export interface GithubRepository {
  description: string
  languages: {
    nodes: Array<{
      id: string
      name: string
    }>
  }
  licenseInfo: {
    spdxId: string
  }
  name: string
  owner: {
    avatarUrl: string
    login: string
    url: string
  }
  primaryLanguage: {
    id: string
    name: string
  }
  releases: {
    nodes: GithubRelease[]
  }
  stargazerCount: number
  url: string
}

export interface GithubResponse {
  viewer: {
    starredRepositories: {
      totalCount: number
      pageInfo: {
        startCursor: string
        hasPreviousPage: string
        endCursor: string
        hasNextPage: boolean
      }
      nodes: GithubRepository[]
    }
  }

  rateLimit: {
    cost: number
    limit: number
    remaining: number
    used: number
    resetAt: string
  }
}

export type ReleaseObj = GithubRelease & {
  repo: Omit<GithubRepository, 'releases'>
}
