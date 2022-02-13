import orderBy from "lodash/orderBy";

export interface GithubRepository {
  archived: boolean;
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: null | string;
  language: null | string;
  stargazers_count: number;
  watchers_count: number;
  topics: string[];
}

export const getLastUpdatedPublicRepositories = () =>
  fetch("https://api.github.com/users/dhedegaard/repos?per_page=1000")
    .then((resp) => resp.json())
    .then((data: Array<GithubRepository>) =>
      orderBy(
        data.filter((repo) => !repo.archived && !repo.private),
        ["stargazer_count", "watchers_count", "pushed_at"],
        ["desc", "desc", "desc"]
      )
    );
