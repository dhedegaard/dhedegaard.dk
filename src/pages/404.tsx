import NextLink from "next/link";
import type { FC } from "react";

const NotFound: FC = () => (
  <>
    <h1 className="text-4xl mb-5">404: Not found</h1>
    <p className="">
      The page does not exist.{" "}
      <NextLink className="text-blue-600" href="/">
        Go to the main page
      </NextLink>
      .
    </p>
  </>
);

export default NotFound;
