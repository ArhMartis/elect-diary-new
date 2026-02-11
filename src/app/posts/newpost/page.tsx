import PostForm from "@/components/PostForm";

export default function NewPostPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl mb-4">Создать новый пост</h1>
      <PostForm />
    </main>
  );
}