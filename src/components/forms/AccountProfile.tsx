"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/compress-image";
import uploadImages from "@/lib/upload-images";
import { isBase64Image } from "@/lib/utils";
import { UserValidation } from "@/lib/validations/user";
import { UserData } from "@/types/user";
import { useSessionList } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Label } from "../ui/label";

const updateProfileImageInClerk = async (
  newUserImage: File,
  currentUserToken: string | null,
  currentSessionId: string
) => {
  const compressedProfileImg = await compressImage(newUserImage);

  const formData = new FormData();
  formData.append("file", compressedProfileImg);

  await axios.post(
    `https://bold-mole-6.clerk.accounts.dev/v1/me/profile_image?_clerk_js_version=4.58.2&_clerk_session_id=${currentSessionId}&__dev_session=${currentUserToken}`,
    formData,
    { withCredentials: true }
  );
};

export default function AccountProfile({ user, btnTitle }: { user: UserData; btnTitle: string }) {
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const { sessions } = useSessionList();
  const currentUserToken = useRef<string | null>(null);

  const form = useForm({
    resolver: zodResolver(UserValidation),
    defaultValues: {
      profile_photo: profilePhoto || user.image,
      name: user.name,
      bio: user.bio,
      username: user.username,
    },
  });

  useEffect(() => {
    let l = async () => {
      if (sessions?.length) currentUserToken.current = await sessions[0].getToken();
    };
    l();
  }, []);

  async function onSubmit(values: z.infer<typeof UserValidation>) {
    setIsLoading(true);
    const blob = values.profile_photo;

    let updateProfileImageInClerkPromise = null;
    const hasImageChanged = isBase64Image(blob);

    if (hasImageChanged && profilePhoto) {
      updateProfileImageInClerkPromise = updateProfileImageInClerk(
        profilePhoto,
        currentUserToken.current,
        sessions[0].id
      );
      return;
      let uploadedImagesUrls = await uploadImages([profilePhoto]);
    }

    await updateProfileImageInClerkPromise;

    if (pathname !== "/settings") {
      router.back();
    } else {
      // First Time
      router.push("/");
    }
    setIsLoading(false);
  }

  function updateProfilePhoto(
    e: ChangeEvent<HTMLInputElement>,
    changeFile: (fileContent: string) => void
  ) {
    e.preventDefault();

    if (!e.target.files?.length) {
      return;
    }

    const file = e.target.files[0];

    if (!file) {
      return;
    }

    setProfilePhoto(file);

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => {
      changeFile(reader.result?.toString() || "");
    };
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 text-white ">
        <FormField
          control={form.control}
          name="profile_photo"
          render={({ field }) => (
            <FormItem className="flex items-center gap-5">
              <FormLabel className="account-form_image-label rounded-full">
                <div className="w-24 h-24 relative">
                  <Image
                    src={field.value}
                    alt="avatar"
                    className="object-cover rounded-full"
                    fill
                  />
                </div>
              </FormLabel>
              <FormControl className="text-gray-200 text-base-semibold flex-1">
                <>
                  <Label htmlFor="picture">Upload Profile Image</Label>
                  <Input
                    id="picture"
                    type="file"
                    placeholder="upload a photo"
                    className="account-form_image-input hidden"
                    onChange={(e) => updateProfilePhoto(e, field.onChange)}
                  />
                </>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Name</FormLabel>
              <FormControl className="text-gray-200 text-base-semibold flex-1">
                <Input
                  type="text"
                  placeholder="Enter your name"
                  className="account-form_input no-focus"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Username</FormLabel>
              <FormControl className="text-gray-200 text-base-semibold flex-1">
                <Input
                  type="text"
                  placeholder="Enter your username"
                  className="account-form_input no-focus"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Bio</FormLabel>
              <FormControl className="text-gray-200 text-base-semibold flex-1">
                <Textarea
                  rows={7}
                  placeholder="Enter your bio"
                  className="account-form_input no-focus"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className={` w-full ${isLoading && "!py-2"}`}
          disabled={isLoading}
          spinnerClass="mx-auto h-5 w-5"
        >
          {btnTitle}
        </Button>
      </form>
    </Form>
  );
}
