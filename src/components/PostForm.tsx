"use client";

import { createPost } from "@/app/actions";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="bg-blue-500 text-white p-2 rounded">
      {pending ? "Сохранение..." : "Опубликовать"}
    </button>
  );
}

export default function PostForm() {
  return (
    <form action={createPost} className="flex flex-col gap-4 max-w-md">
      <input 
        name="title" 
        placeholder="Заголовок" 
        required 
        className="border p-2 rounded"
      />
      <textarea 
        name="content" 
        placeholder="Текст поста" 
        required 
        className="border p-2 rounded h-32"
      />
      <SubmitButton />
    </form>
  );
}