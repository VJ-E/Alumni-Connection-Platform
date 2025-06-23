import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfilePhoto from "./shared/ProfilePhoto";
import { Textarea } from "./ui/textarea";
import { Images } from "lucide-react";
import { useRef, useState } from "react";
import { readFileAsDataUrl } from "@/lib/utils";
import Image from "next/image";
import { createPostAction } from "@/lib/serveractions";
import { toast } from "react-toastify";

export function PostDialog({
  setOpen,
  open,
  src,
  fullName,
}: {
  setOpen: any;
  open: boolean;
  src: string;
  fullName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeHandler = (e: any) => {
    setInputText(e.target.value);
  };

  const fileChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await readFileAsDataUrl(file);
      setSelectedFile(dataUrl);
    }
  };

  const postActionHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      toast.error("Please enter some text for your post");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPostAction(inputText, selectedFile);
      toast.success("Post Created Successfully");
      setInputText("");
      setSelectedFile("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={() => !isSubmitting && setOpen(false)}
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle className="flex gap-2">
            <ProfilePhoto src={src} />
            <div>
              <h1>{fullName}</h1>
              <p className="text-xs">Post to anyone</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={postActionHandler}>
          <div className="flex flex-col">
            <Textarea
              id="postText"
              name="inputText"
              value={inputText}
              onChange={changeHandler}
              className="border-none text-md focus-visible:ring-0"
              placeholder="What do you want to share?"
              required
            />
            <div className="my-4">
              {selectedFile && (
                <Image
                  src={selectedFile}
                  alt="preview-image"
                  width={400}
                  height={400}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <div className="flex items-center gap-4">
              <input
                ref={inputRef}
                onChange={fileChangeHandler}
                type="file"
                name="image"
                className="hidden"
                accept="image/*"
              />
              <Button 
                type="submit" 
                disabled={isSubmitting || !inputText.trim()}
              >
                {isSubmitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </DialogFooter>
        </form>
        <Button
          className="gap-2"
          onClick={() => inputRef?.current?.click()}
          variant={"ghost"}
          disabled={isSubmitting}
        >
          <Images className="text-blue-500" />
          <p>Media</p>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
