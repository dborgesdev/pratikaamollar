import { useState } from 'react';
import { Play } from 'lucide-react';
import { embedUrl, type ProductVideo } from '../lib/product-media';
export default function EmbeddedVideo({ video }: { video: ProductVideo }) {
  const [playing, setPlaying] = useState(false);
  const src = embedUrl(video.type, video.src);
  if (!src) return null;
  return <div className="embedded-product-video">{playing ? <iframe src={src} title={video.title} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/> : <button type="button" onClick={() => setPlaying(true)} aria-label={'Reproduzir ' + video.title}>{video.poster && <img src={video.poster} alt="" width="700" height="700"/>}<span><Play aria-hidden="true"/>Reproduzir vídeo</span></button>}</div>;
}
