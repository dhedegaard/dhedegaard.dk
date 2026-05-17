import Image from 'next/image'

interface AvatarProps {
  src: string
}
export function Avatar({ src }: AvatarProps) {
  return (
    <div className="relative aspect-square w-[90px] flex-none self-start max-md:w-[60px]">
      <Image
        className="border-separate rounded-[50%] object-cover"
        priority
        src={src}
        crossOrigin="anonymous"
        alt="Me"
        fill
        sizes="(max-width: 767px) 60px, 90px"
      />
    </div>
  )
}
