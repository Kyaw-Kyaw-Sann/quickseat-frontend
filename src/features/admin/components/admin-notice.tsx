import { cn } from "@/lib/utils/cn";

export function AdminNotice({
  message,
  tone = "error",
}: {
  message: string;
  tone?: "error" | "success";
}) {
  return (
    <p
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        tone === "success"
          ? "border-[#285c3b] bg-[#10271a] text-[#8ce6aa]"
          : "border-[#6d2428] bg-[#2b1215] text-[#ff9b9b]",
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}
