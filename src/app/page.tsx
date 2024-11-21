import Image from 'next/image'
import { memo, use } from 'react'
import { getDataAction } from '../fetchers/data-action'
import { BioElement } from './bio-element.tsx'
import { FindMeElement } from './find-me-element.tsx'
import { Repositories } from './repositories'

export const dynamic = 'force-static'

export default function Index() {
  const data = use(getDataAction())

  return (
    <>
      <div className="mb-16 mt-8 flex gap-4">
        <div className="flex flex-auto flex-col gap-6">
          <h1 className="animate-slideTitle text-5xl">Dennis Hedegaard</h1>
          <BioElement seededBio={data.bio} />

          <FindMeElement seededData={data} />
        </div>
        <Avatar />
      </div>
      <Repositories seededRepositories={data.repositories} />
    </>
  )
}

const Avatar = memo(function Avatar() {
  return (
    <div className="relative aspect-square w-[90px] flex-none animate-slideAvatar self-start max-md:w-[60px]">
      <Image
        className="border-separate rounded-[50%] object-cover"
        priority
        src="https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f?s=360"
        crossOrigin="anonymous"
        alt="Me"
        fill
        sizes="(max-width: 767px) 60px, 90px"
      />
    </div>
  )
})
