export function toEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube-nocookie.com/embed/${v}?rel=0`;
      const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}?rel=0`;
      const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return `https://www.youtube-nocookie.com/embed/${embedMatch[1]}?rel=0`;
    }
    if (u.hostname.includes('youtu.be')) {
      const v = u.pathname.replace('/', '').split('/')[0].split('?')[0];
      if (v) return `https://www.youtube-nocookie.com/embed/${v}?rel=0`;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.replace('/', '');
      return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function goSlide(tid, delta) {
  const track = document.getElementById(`gt-${tid}`);
  if (!track) return;
  const total = track.children.length;
  let idx = parseInt(track.dataset.idx) || 0;
  if (delta === -1) idx = Math.max(0, idx - 1);
  else if (delta === 1) idx = Math.min(total - 1, idx + 1);
  else idx = delta;
  track.dataset.idx = idx;
  track.style.transform = `translateX(-${idx * 100}%)`;
  const dots = document.getElementById(`gd-${tid}`);
  if (dots) {
    dots.querySelectorAll('.g-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  }
}
