import { unstable_cache } from 'next/cache'
import { getDataAction } from '../fetchers/data-action'
import { Avatar } from './avatar'
import { BioElement } from './bio-element'
import { FindMeElement } from './find-me-element'
import { Repositories } from './repositories'

export const revalidate = false
export const runtime = 'edge'

const cachedGetDataAction = unstable_cache(() => getDataAction(), ['getDataAction'], {
  revalidate: 60 * 60 * 24 * 7,
})

export default async function Index() {
  const data = await cachedGetDataAction()

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
