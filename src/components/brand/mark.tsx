import { cn } from "@/lib/utils"

type AppBrandMarkProps = {
  className?: string
  title?: string
}

export function AppBrandMark({ className, title }: AppBrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-accent", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <g transform="rotate(-18 16 17)">
        <rect
          x="7.5"
          y="6.5"
          width="12"
          height="18"
          rx="1.75"
          className="fill-accent/18 stroke-accent/70"
          strokeWidth="1.35"
        />
      </g>
      <g transform="rotate(18 16 17)">
        <rect
          x="12.5"
          y="6.5"
          width="12"
          height="18"
          rx="1.75"
          className="fill-accent/18 stroke-accent/70"
          strokeWidth="1.35"
        />
      </g>
      <rect
        x="10"
        y="5"
        width="12"
        height="20"
        rx="1.75"
        className="fill-sidebar stroke-accent"
        strokeWidth="1.65"
      />
      <path
        d="M16 10.25 19.6 12.35v4.2L16 18.65l-3.6-2.1v-4.2L16 10.25Z"
        className="fill-accent/40 stroke-accent"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M16 13.1 17.55 14v1.8L16 16.7 14.45 15.8V14L16 13.1Z"
        className="fill-accent"
      />
    </svg>
  )
}
