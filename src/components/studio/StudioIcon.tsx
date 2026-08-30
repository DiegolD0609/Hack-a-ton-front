import type { ReactNode, SVGProps } from 'react'

export type StudioIconName =
  | 'arrow'
  | 'bolt'
  | 'braces'
  | 'check'
  | 'chevron'
  | 'cursor'
  | 'eye'
  | 'help'
  | 'layers'
  | 'message'
  | 'pause'
  | 'play'
  | 'refresh'
  | 'spark'
  | 'thumbDown'
  | 'thumbUp'
  | 'workflow'

interface StudioIconProps extends SVGProps<SVGSVGElement> {
  name: StudioIconName
  size?: number
}

const paths: Record<StudioIconName, ReactNode> = {
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />,
  braces: <path d="M9 4H7a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h2m6-14h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-2" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  cursor: <path d="m5 3 14 9-6 1-3 6L5 3Z" />,
  eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.2a2.5 2.5 0 1 1 3.6 2.4c-.8.5-1.2.9-1.2 1.9" /><path d="M12 17h.01" /></>,
  layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></>,
  message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />,
  pause: <><path d="M9 5v14M15 5v14" /></>,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  refresh: <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 0-2 5" /></>,
  spark: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></>,
  thumbDown: <path d="M7 3v12H3V3h4Zm3 0h6.7a2 2 0 0 1 1.9 2.6L17 11h3l-5 10-2-1v-5h-3V3Z" />,
  thumbUp: <path d="M7 21V9H3v12h4Zm3 0h6.7a2 2 0 0 0 1.9-2.6L17 13h3L15 3l-2 1v5h-3v12Z" />,
  workflow: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /><path d="M9 6h3a3 3 0 0 1 3 3v6m-3-3 3 3 3-3" /></>,
}

export default function StudioIcon({ name, size = 18, ...props }: StudioIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
