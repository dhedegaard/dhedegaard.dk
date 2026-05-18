import { cacheLife } from 'next/cache'
import { getDataAction } from '../fetchers/data-action'
import { Avatar } from './avatar'
import { BioElement } from './bio-element'
import { FindMeElement } from './find-me-element'
import { Repositories } from './repositories'
import { Tagline } from './tagline'
import { TechStack } from './tech-stack'

export default async function Index() {
  'use cache'
  cacheLife('days')
  const data = await getDataAction()

  return (
    <>
      <div className="mt-10 mb-12 flex gap-6">
        <div className="flex flex-auto flex-col gap-4">
          <h1 className="text-5xl">Dennis Hedegaard</h1>
          <Tagline />
          <BioElement bio={data.bio} />
          <TechStack />
          <div className="md:hidden">
            <FindMeElement githubUrl={data.githubUrl} email={data.email} direction="row" />
          </div>
        </div>
        <div className="flex w-32 max-md:w-[60px] flex-none flex-col gap-3 self-start">
          <Avatar src={data.avatarUrl} />
          <div className="max-md:hidden">
            <FindMeElement githubUrl={data.githubUrl} email={data.email} />
          </div>
        </div>
      </div>
      <Repositories repositories={data.repositories} />
    </>
  )
}
