/**
 * You can build your query from here:
 * <https://docs.github.com/en/graphql/overview/explorer>
 */
export const userQuery = /* GraphQL */`
  query UserQuery {
    user(login: "dhedegaard") {
      id
      avatarUrl(size: 360)
      url
      email
      pinnedItems(first: 100) {
        nodes {
          __typename
          ... on Repository {
            id
            name
          }
        }
      }
      repositories(orderBy: { field: PUSHED_AT, direction: DESC }, privacy: PUBLIC, first: 100) {
        edges {
          node {
            id
            owner {
              id
            }
            name
            url
            pushedAt
            description
            isArchived
            stargazerCount
            isPrivate
            homepageUrl
            repositoryTopics(first: 100) {
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
