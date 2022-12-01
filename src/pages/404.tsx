import type { FC } from "react";
import NextLink from "next/link";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

const NotFound: FC = () => (
  <>
    <Typography variant="h4" component="h1" paragraph>
      404: Not found
    </Typography>
    <Typography paragraph>
      The page does not exist.{" "}
      <Link component={NextLink} href="/">
        Go to the main page
      </Link>
      .
    </Typography>
  </>
);

export default NotFound;
