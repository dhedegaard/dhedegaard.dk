import { cacheLife } from 'next/cache'
import { getDataAction } from '../fetchers/data-action'
import { Avatar } from './avatar'
import { BioElement } from './bio-element'
import { FindMeElement } from './find-me-element'
import { Repositories } from './repositories'

export default async function Index() {
  'use cache'
  cacheLife('days')
  const data = await getDataAction()

  return (
    <>
      <div className="mt-8 mb-16 flex gap-4">
        <div className="flex flex-auto flex-col gap-6">
          <h1 className="animate-slideTitle text-5xl">Dennis Hedegaard</h1>
          <BioElement bio={data.bio} />

          <FindMeElement githubUrl={data.githubUrl} email={data.email} />
        </div>
        <Avatar />
      </div>
      <Repositories repositories={data.repositories} />
    </>
  )
}
