import Loading from "@/components/ui/loading";

export default function RootLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#17191c]">
      <Loading className="h-12 w-12" />
    </div>
  );
}
