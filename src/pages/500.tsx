import { FC } from "react";
import NextLink from "next/link";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

const NotFound: FC = () => (
  <Typography variant="h4" component="h1" paragraph>
    500: Internal Server Error
  </Typography>
);

export default NotFound;
