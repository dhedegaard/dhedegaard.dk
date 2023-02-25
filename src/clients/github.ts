import type { Language, RepositoryTopic, User } from "../codegen/types";
import { userQuery } from "./user-query";

export interface GithubRepository {
  id: string;
  name: string;
  url: string;
  pinned: boolean;
  description: string | null;
  updatedAt: string | null;
  pushedAt: string | null;
  homepageUrl: null | string;
  languages: Language[];
  stargazerCount: number;
  topics: RepositoryTopic[];
}

export const getGithubUser = async () => {
  const pat: unknown = process.env["GITHUB_PAT"];
  if (typeof pat !== "string" || pat === "") {
    throw new Error("GITHUB_PAT is not set");
  }
  return await fetch("https://api.github.com/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: userQuery.loc!.source!.body,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${pat}`,
    },
    next: {
      revalidate: 21_600, // 6 hours
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(res.status + ": " + res.statusText);
      }
      return res.json() as Promise<{ errors?: any; data: { user: User } }>;
    })
    .then((res) => {
      if (res.errors != null) {
        console.error("Error in Github response:", res.errors);
        return undefined;
      }
      return res.data.user;
    });
};
