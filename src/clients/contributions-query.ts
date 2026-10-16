import { graphql } from './graphql'

/** One account's daily contribution counts for the past year (GitHub's default window). */
export const contributionsQuery = graphql(`
  query ContributionsQuery($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`)
