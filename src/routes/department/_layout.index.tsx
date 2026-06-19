import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/department/_layout/")({
  beforeLoad: () => { throw redirect({ to: "/department/tickets" }); },
});
