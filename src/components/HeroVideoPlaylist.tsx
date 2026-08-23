import { useRef, useState } from 'react'

const videos = [
  { src: '/videos/logistics-loading.mp4', label: 'Carga' },
  { src: '/videos/logistics-scanning.mp4', label: 'Operación' },
  { src: '/videos/logistics-tracking.mp4', label: 'Trazabilidad' },
] as const

export default function HeroVideoPlaylist() {
  const [activeVideo, setActiveVideo] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function selectVideo(index: number) {
    setIsReady(false)
    setActiveVideo(index)
    setIsPlaying(true)
  }

  function playNext() {
    selectVideo((activeVideo + 1) % videos.length)
  }

  async function togglePlayback() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      await video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  return (
    <>
      <video
        key={videos[activeVideo].src}
        ref={videoRef}
        src={videos[activeVideo].src}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 sm:bottom-7 sm:right-7">
        <div className="glass-control flex items-center gap-1 p-1.5" aria-label="Seleccionar video del hero">
          {videos.map((video, index) => (
            <button
              key={video.src}
              type="button"
              onClick={() => selectVideo(index)}
              className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${activeVideo === index ? 'bg-white text-ink' : 'text-white/75 hover:text-white'}`}
              aria-current={activeVideo === index ? 'true' : undefined}
            >
              {video.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={togglePlayback}
          className="glass-control grid h-11 w-11 place-items-center"
          aria-label={isPlaying ? 'Pausar video' : 'Reproducir video'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </>
  )
}

function PauseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5h3v14H7zm7 0h3v14h-3z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
