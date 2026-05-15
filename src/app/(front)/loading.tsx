import Loading from "@/components/ui/loading";

export default function GlobalLoading() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <Loading className="h-16 w-16" />
    </div>
  );
}
