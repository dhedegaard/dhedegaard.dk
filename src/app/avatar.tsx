import Image from 'next/image'
import { memo } from 'react'

export const Avatar = memo(function Avatar() {
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
