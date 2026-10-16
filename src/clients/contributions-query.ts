import { graphql } from './graphql'

/** One account's daily contribution counts for one window of at most a year, plus its active years. */
export const contributionsQuery = graphql(`
  query ContributionsQuery($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionYears
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
