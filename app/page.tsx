import Hello from "@/app/components/hello";
const page = () => {

  console.log("what type of a component am I ?");
  return (
    <main>
      <div className="text-5xl underline">Welcome to Next.js!</div>
      <Hello/>
    </main>
  )
}

export default page