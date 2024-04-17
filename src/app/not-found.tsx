import Link from 'next/link'

export default function NotFound() {
  return (
    <>
      <h1 className="mb-5 text-4xl">404: Not found</h1>
      <p>
        The page does not exist.{' '}
        <Link className="text-blue-600" href="/">
          Go to the main page
        </Link>
        .
      </p>
    </>
  )
}
