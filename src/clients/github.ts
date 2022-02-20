import { Language, RepositoryTopic, User } from "../codegen/types";
import { userQuery } from "./user-query";

export interface GithubRepository {
  id: string;
  name: string;
  url: string;
  pinned: boolean;
  description: string | null;
  updatedAt: unknown;
  homepageUrl: null | string;
  languages: Language[];
  stargazerCount: number;
  topics: RepositoryTopic[];
}

export const getGithubUser = async () => {
  return await fetch("https://api.github.com/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: userQuery.loc!.source!.body,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${process.env.GITHUB_PAT}`,
    },
  })
    .then(
      (res) => res.json() as Promise<{ errors?: any; data: { user: User } }>
    )
    .then((res) => {
      if (res.errors != null) {
        console.error("Error in Github response:", res.errors);
        return undefined;
      }
      return res.data.user;
    });
};
