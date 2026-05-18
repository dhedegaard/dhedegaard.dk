import Image from 'next/image'

interface AvatarProps {
  src: string
}
export function Avatar({ src }: AvatarProps) {
  return (
    <div className="relative aspect-square w-full">
      <Image
        className="rounded-full object-cover"
        priority
        src={src}
        crossOrigin="anonymous"
        alt="Dennis Hedegaard"
        fill
        sizes="(max-width: 767px) 60px, 128px"
      />
    </div>
  )
}
