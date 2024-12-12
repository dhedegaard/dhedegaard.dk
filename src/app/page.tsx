import { getDataAction } from '../fetchers/data-action'
import { Avatar } from './avatar'
import { BioElement } from './bio-element.tsx'
import { FindMeElement } from './find-me-element.tsx'
import { Repositories } from './repositories'

export const revalidate = false
export const runtime = 'edge'

export default async function Index() {
  const data = await getDataAction()

  return (
    <>
      <div className="mb-16 mt-8 flex gap-4">
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
