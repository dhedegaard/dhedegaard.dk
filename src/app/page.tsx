import Image from 'next/image'
import { memo, use } from 'react'
import { getDataAction } from '../fetchers/data-action'
import { EnvelopeIcon } from '../icons/envelope'
import { GithubIcon } from '../icons/github'
import { LinkedInIcon } from '../icons/linkedin'
import { Repositories } from './Repositories'

export const dynamic = 'force-static'

export default function Index() {
  const data = use(getDataAction())

  return (
    <>
      <div className="flex gap-4 mt-8 mb-16">
        <div className="flex flex-auto flex-col gap-6">
          <h1 className="text-5xl animate-slideTitle">Dennis Hedegaard</h1>
          {data.bio != null && <p className="animate-slideBio">{data.bio}</p>}

          <p className="animate-slideFindMe">
            Find me on{' '}
            {data.githubUrl != null && (
              <>
                <a className="decoration-none text-blue-600" href={data.githubUrl}>
                  <GithubIcon className="fill-blue-600  inline" width={16} />
                  &nbsp;
                  <span>Github</span>
                </a>
                ,{' '}
              </>
            )}
            <a
              className="decoration-none text-blue-600"
              href="https://www.linkedin.com/in/dennis-hedegaard-39a02a22/"
            >
              <LinkedInIcon className="inline fill-blue-600" width={16} />
              &nbsp;
              <span>LinkedIn</span>
            </a>{' '}
            {data.email != null && (
              <>
                or send me a{' '}
                <a className="decoration-none text-blue-600" href={`mailto:${data.email}`}>
                  <EnvelopeIcon className="inline w-4 fill-blue-600" width={16} />
                  &nbsp;
                  <span>mail</span>
                </a>
                .
              </>
            )}
          </p>
        </div>
        <Avatar />
      </div>
      <Repositories repositories={data.repositories} />
    </>
  )
}

const Avatar = memo(function Avatar() {
  return (
    <div className="animate-slideAvatar self-start flex-none relative w-[90px] aspect-square max-md:w-[60px]">
      <Image
        className="object-cover rounded-[50%] border-separate"
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
