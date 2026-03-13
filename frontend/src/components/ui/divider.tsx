export function Divider({ className = "" }: { className?: string }) {
  return (
    <hr className={`border-none border-t border-border my-4 ${className}`} />
  );
}
