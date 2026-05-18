"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import Image from "next/image";
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from "@/lib/utils/youtube";

interface Props {
  videoId: string;
  channel?: string;
  title?: string;
}

export default function VideoPlayer({ videoId, channel = "@facilitraining", title }: Props) {
  const [playing, setPlaying] = useState(false);
  const thumb = getYouTubeThumbnail(videoId);
  const embed = getYouTubeEmbedUrl(videoId);

  if (playing) {
    return (
      <div className="overflow-hidden rounded-xl">
        <iframe
          src={`${embed}&autoplay=1`}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title ?? "Como fazer o exercício"}
        />
        <div className="bg-bg-elevated px-3 py-1.5 text-[10px] text-gray-500">{channel}</div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="group relative w-full overflow-hidden rounded-xl"
    >
      <Image
        src={thumb}
        alt={title ?? "Thumbnail"}
        width={320}
        height={180}
        className="aspect-video w-full object-cover"
        unoptimized
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 transition group-active:bg-black/60">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
          <Play className="h-5 w-5 fill-white" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1 text-[10px] text-gray-300">
        {channel}
      </div>
    </button>
  );
}
