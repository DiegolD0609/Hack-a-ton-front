import { useState } from 'react'

const videos = [
  '/videos/logistics-loading.mp4',
  '/videos/logistics-scanning.mp4',
  '/videos/logistics-tracking.mp4',
] as const

export default function HeroVideoPlaylist() {
  const [activeVideo, setActiveVideo] = useState(0)
  const [isReady, setIsReady] = useState(false)

  function playNext() {
    setIsReady(false)
    setActiveVideo((video) => (video + 1) % videos.length)
  }

  return (
    <>
      <video
        key={videos[activeVideo]}
        src={videos[activeVideo]}
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlay={() => setIsReady(true)}
        onEnded={playNext}
        onError={playNext}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/30" />
    </>
  )
}
