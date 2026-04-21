import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { updateProfile } from "./actions";
import AvatarUploader from "@/components/AvatarUploader";
import Link from "next/link";
import Image from "next/image";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const user = session.user;

  return <ProfileClient user={user} />;
}
