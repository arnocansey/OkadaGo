import { OkadaLoader } from "@/components/ui/OkadaLoader";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("inline-flex", className)} {...props}>
      <OkadaLoader size="xs" />
    </div>
  );
}

export { Spinner };
