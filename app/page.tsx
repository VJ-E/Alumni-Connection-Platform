import Feed from "@/components/Feed";
import News from "@/components/News";
import Sidebar from "@/components/Sidebar";
import { currentUser } from "@clerk/nextjs/server";
// import { redirect } from "next/dist/server/api-utils";
import { redirect } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default async function Home() {
  const user = await currentUser();
  
  if(!user){
    redirect("/sign-in");
  }

  // Create a plain object with only the needed user data
  const userData = user ? {
    id: user.id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    imageUrl: user.imageUrl || "",
    // Convert complex email array to simple array of strings
    emailAddresses: user.emailAddresses?.map(email => email.emailAddress) || []
  } : null;
   
  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto flex justify-between gap-8">
        <Feed user={userData}/>
      </div>
      <ToastContainer />
    </div>
  );
}
