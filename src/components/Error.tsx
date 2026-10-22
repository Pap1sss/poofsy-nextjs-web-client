import { Sprite } from "@/components/pixel/sprites";

type ErrorProps = {
  message?: string;
  title?: string;
};

/** A failed request, shown as a small dialogue box with the alert sprite. */
export default function Error({ message = "An error occurred", title = "" }: ErrorProps) {
  return (
    <div
      role="alert"
      className="pixel-box bg-card mb-4 flex items-center justify-center gap-3 px-4 py-3"
    >
      <Sprite name="alert" size={20} />
      <p className="text-expense text-sm">
        {title ? `${title}: ` : ""}
        {message}
      </p>
    </div>
  );
}
