import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

const handleAuth = async () => {
    const {userId} = await auth();
    if (!userId) throw new Error("Unauthorized");
    return { userId};
}

export const ourFileRouter = {
    bookAttachment: f({
        pdf: {maxFileSize: "32MB", maxFileCount: 1},
        text: {maxFileSize: "8MB", maxFileCount: 1},
        blob: {maxFileSize: "32MB", maxFileCount: 1}
    })
        .middleware(async () => {
            return await handleAuth();
        })
        .onUploadComplete(async ({metadata, file}) => {
            console.log("Upload complete for userId:", metadata.userId);
            console.log("file url", file.url);
            return { uploadedBy: metadata.userId, url: file.url, name: file.name };
        } ),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;