"use client";

import clsx from "clsx";
import { FC, Fragment, memo, useCallback, useMemo } from "react";
import { create } from "zustand";
import type { GithubRepository } from "../clients/github";
import type { Topic as TopicType } from "../codegen/types";
import { GithubIcon } from "../icons/github";
import { LinkIcon } from "../icons/link";
import { MapPinIcon } from "../icons/map-pin";
import { StarIcon } from "../icons/star";

const useFilters = create<{
  selectedKeys: Set<string>;
  toggleKey: (key: string) => void;
  clearFilters: () => void;
}>((set) => ({
  selectedKeys: new Set(),
  toggleKey: (key: string) =>
    set((state) => ({
      selectedKeys: new Set(
        state.selectedKeys.has(key)
          ? [...state.selectedKeys].filter((k) => k !== key)
          : [...state.selectedKeys, key]
      ),
    })),
  clearFilters: () => set({ selectedKeys: new Set() }),
}));

export const Repositories = memo(function Repositories({
  repositories,
}: {
  repositories: readonly GithubRepository[];
}) {
  const selectedKeys = useFilters((state) => state.selectedKeys);
  const filteredRepositories = useMemo(() => {
    const selectedKeysList = [...selectedKeys];
    return selectedKeys.size === 0
      ? repositories
      : repositories.filter((repo) =>
          selectedKeysList.every((key) =>
            repo.topics.some(({ topic }) => `topic#${topic.id}` === key)
          )
        );
  }, [repositories, selectedKeys]);

  const clearFilters = useFilters((state) => state.clearFilters);

  return (
    <div className="animate-slideRepositories">
      <div className="flex w-full justify-between items-center">
        <h2 className="text-xl mb-4">Interresting Github projects</h2>
        {selectedKeys.size > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="border border-black rounded-2xl p-1 px-2 hover:shadow text-xs bg-black text-white transition"
          >
            Clear fitlers
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 grid-flow-row gap-6 mb-9 w-full max-md:grid-cols-1">
        {filteredRepositories.map((repo) => (
          <Repo key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  );
});

const Repo: FC<{ repo: GithubRepository }> = memo(function Repo({ repo }) {
  return (
    <div className="border rounded p-4 box-border flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <a
          className="text-inherit no-underline flex font-bold"
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {repo.name}&nbsp;
          <GithubIcon className="w-4" />
        </a>
        <div className="flex gap-2 items-center">
          {repo.stargazerCount > 0 && (
            <div className="flex gap-1 items-center" title="Stargazers">
              <span className="text-sm">{repo.stargazerCount}</span>
              <StarIcon width={16} />
            </div>
          )}
          {repo.pinned && (
            <div title="Pinned">
              <MapPinIcon width={10} />
            </div>
          )}
        </div>
      </div>

      <span className="flex-auto text-sm">{repo.description}</span>

      {repo.homepageUrl != null && (
        <div className="flex items-center gap-2">
          <LinkIcon width={11} />{" "}
          <a
            className="no-underline text-blue-600 overflow-ellipsis text-xs"
            href={repo.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {repo.homepageUrl.split("://")[1] ?? repo.homepageUrl}
          </a>
        </div>
      )}

      {repo.topics.length > 0 && (
        <div className="inline-flex flex-wrap gap-1 w-full">
          {repo.topics.map(({ topic }) => (
            <Topic key={topic.id} topic={topic} />
          ))}
        </div>
      )}

      {repo.languages.length > 0 && (
        <span className="text-xs">
          Language(s):&nbsp;
          {repo.languages.map((language, index) => (
            <Fragment key={language.id}>
              <span className="font-bold inline text-xs">{language.name}</span>
              {index < repo.languages.length - 1 ? ", " : null}
            </Fragment>
          ))}
        </span>
      )}
    </div>
  );
});

const Topic = memo(function Topic({ topic }: { topic: TopicType }) {
  const toggleKey = useFilters((state) => state.toggleKey);
  const selectedTopicIds = useFilters((state) => state.selectedKeys);
  const isSelected = useMemo(
    () => selectedTopicIds.has(`topic#${topic.id}`),
    [selectedTopicIds, topic.id]
  );

  const handleClick = useCallback(
    () => toggleKey(`topic#${topic.id}`),
    [toggleKey, topic.id]
  );

  return (
    <button
      type="button"
      className={clsx(
        "border border-gray-400 rounded-2xl text-xs p-1 px-2 cursor-pointer hover:shadow-lg transition select-none",
        isSelected && "bg-black text-white border-black"
      )}
      onClick={handleClick}
      role="switch"
      aria-checked={isSelected ? "true" : "false"}
    >
      {topic.name}
    </button>
  );
});
