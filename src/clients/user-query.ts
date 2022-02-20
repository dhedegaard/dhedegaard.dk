import gql from "graphql-tag";

export const userQuery = gql`
  {
    user(login: "dhedegaard") {
      id
      name
      avatarUrl
      bio
      pinnedItems(first: 100) {
        nodes {
          ... on Repository {
            id
            name
          }
        }
      }
      topRepositories(
        orderBy: { field: PUSHED_AT, direction: DESC }
        first: 100
      ) {
        totalCount
        pageInfo {
          hasNextPage
        }
        edges {
          node {
            id
            owner {
              id
            }
            name
            url
            description
            isArchived
            stargazerCount
            isPrivate
            homepageUrl
            repositoryTopics(first: 100) {
              totalCount
              pageInfo {
                hasNextPage
              }
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
`;
