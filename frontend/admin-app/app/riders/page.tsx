import { notFound } from "next/navigation";
import AdminScreenClient from "../[screen]/admin-screen-client";

export default function AdminRidersRootPage() {
  return <AdminScreenClient screen="riders" />;
}
