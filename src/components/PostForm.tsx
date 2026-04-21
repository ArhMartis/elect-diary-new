"use client";

import { createPost } from "@/app/actions";
import { useFormStatus } from "react-dom";
import { useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-gradient btn-primary btn-lg gap-2"
    >
      {pending ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          Сохранение...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Опубликовать
        </>
      )}
    </button>
  );
}

export default function PostForm() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form action={createPost} className="space-y-8">
      {/* Заголовок */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-lg font-semibold flex items-center gap-2 text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h4a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Заголовок поста
          </span>
          <span className="label-text-alt text-red-600 font-semibold">Обязательно</span>
        </label>
        <input
          name="title"
          type="text"
          placeholder="Введите заголовок..."
          required
          className="input input-bordered input-lg w-full focus:input-primary bg-white text-gray-900 placeholder-gray-400 font-semibold"
        />
      </div>

      {/* Содержимое */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-lg font-semibold flex items-center gap-2 text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
            </svg>
            Текст поста
          </span>
          <span className="label-text-alt text-red-600 font-semibold">Обязательно</span>
        </label>
        <textarea
          name="content"
          placeholder="Напишите содержание поста..."
          required
          rows={8}
          className="textarea textarea-bordered textarea-lg w-full focus:textarea-primary resize-none bg-white text-gray-900 placeholder-gray-400 font-medium"
        />
      </div>

      {/* Загрузка изображения */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-lg font-semibold flex items-center gap-2 text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
            </svg>
            Изображение
          </span>
          <span className="label-text-alt text-gray-600">Необязательно</span>
        </label>

        <div
          className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
            isDragging
              ? "border-indigo-500 bg-indigo-50 scale-[1.02] ring-4 ring-indigo-200"
              : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input file-input-bordered file-input-primary w-full opacity-0 absolute inset-0 cursor-pointer"
            style={{ height: "120px" }}
          />
          <div className="flex flex-col items-center justify-center py-8 pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold">Перетащите изображение сюда</p>
            <p className="text-gray-500 text-sm mt-1">или нажмите для выбора файла</p>
          </div>
        </div>

        {/* Превью изображения */}
        {imagePreview && (
          <div className="mt-6 relative">
            <div className="card bg-gradient-to-br from-base-200 to-base-300 shadow-inner">
              <figure className="px-4 pt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-2xl max-h-72 object-contain shadow-lg"
                />
              </figure>
              <div className="card-body items-center text-center py-4">
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="btn btn-circle btn-outline btn-error btn-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Переключатель публикации */}
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-4">
          <input
            type="checkbox"
            name="published"
            value="true"
            defaultChecked
            className="toggle toggle-lg bg-gray-300 checked:bg-indigo-600"
          />
          <div>
            <span className="label-text text-lg font-semibold text-gray-800">Опубликовать сразу</span>
            <p className="text-sm text-gray-600">Если выключено, пост будет сохранен как черновик</p>
          </div>
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <SubmitButton />
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Отмена
        </button>
      </div>
    </form>
  );
}
