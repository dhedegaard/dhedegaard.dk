import gql from 'graphql-tag'

/**
 * You can build your query from here:
 * <https://docs.github.com/en/graphql/overview/explorer>
 */
export const userQuery = gql`
  {
    user(login: "dhedegaard") {
      id
      name
      avatarUrl
      bio
      websiteUrl
      url
      email
      pinnedItems(first: 100) {
        nodes {
          ... on Repository {
            id
            name
          }
        }
      }
      topRepositories(orderBy: { field: PUSHED_AT, direction: DESC }, first: 100) {
        totalCount
        edges {
          node {
            id
            owner {
              id
            }
            name
            url
            updatedAt
            pushedAt
            description
            isArchived
            stargazerCount
            isPrivate
            homepageUrl
            repositoryTopics(first: 100) {
              totalCount
              edges {
                node {
                  id
                  topic {
                    id
                    name
                  }
                }
              }
            }
            primaryLanguage {
              id
              color
              name
            }
            languages(first: 100) {
              totalCount
              edges {
                node {
                  id
                  color
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`
