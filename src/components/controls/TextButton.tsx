interface TextButtonProps {
  label: string;
  title?: string;
  onClick: () => void;
}

/** A small gold link-style button, used for "all", "none" and "default". */
export function TextButton({ label, title, onClick }: TextButtonProps) {
  return (
    <button type="button" className="text-button" title={title} onClick={onClick}>
      {label}
    </button>
  );
}
