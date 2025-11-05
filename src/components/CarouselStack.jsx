import React, { useEffect, useRef, useState } from 'react';
import '../index.css'; // ensure base styles are loaded

// Config
const FADE_DURATION_MS = 700; // fade time in ms (matches CSS)
const INTERVAL_MS = 1000;     // change every 1 second

const createSequence = (imgs) => {
  if (!imgs || imgs.length < 3) return imgs.slice();
  return [
    imgs[0],
    imgs[1],
    imgs[2],
    imgs[1],
    imgs[0],
    imgs[1],
    imgs[2],
  ];
};

export default function CarouselStack({ upperSrc, timeSrc, bottomImgs = [] }) {
  const sequence = createSequence(bottomImgs);
  const uniqueImgs = Array.from(new Set(sequence));

  const [loadedMap, setLoadedMap] = useState({});
  const [containerSize, setContainerSize] = useState({ width: null, height: null });

  const [idx, setIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showClickOverlay, setShowClickOverlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const timeIntervalRef = useRef(null);

  // Preload unique bottom images and determine natural size of first image
  useEffect(() => {
    mountedRef.current = true;
    let alive = true;
    const promises = uniqueImgs.map((src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve([src, { width: img.naturalWidth, height: img.naturalHeight, ok: true }]);
        img.onerror = () => resolve([src, { width: 0, height: 0, ok: false }]);
        img.src = src;
      })
    );

    Promise.all(promises).then((entries) => {
      if (!alive) return;
      const map = Object.fromEntries(entries);
      if (mountedRef.current) setLoadedMap(map);

      const firstSrc = sequence[0];
      const first = map[firstSrc];
      if (first && first.width) {
        setContainerSize({ width: first.width, height: first.height });
      }
    });

    return () => { alive = false; mountedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottomImgs.join('|')]);

  // Update current time every second
  useEffect(() => {
    timeIntervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    };
  }, []);

  // Auto-rotate carousel (pause when overlay is shown)
  useEffect(() => {
    if (!sequence || sequence.length === 0 || showClickOverlay) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % sequence.length);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), FADE_DURATION_MS);
    }, INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence.join('|'), showClickOverlay]);

  // Handle click to show/hide overlay
  const handleClick = () => {
    setShowClickOverlay((prev) => !prev);
  };

  // Format date as M/D/YYYY
  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Format time as H:MM:SS AM/PM
  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const secondsStr = seconds < 10 ? '0' + seconds : seconds;
    return `${hours}:${minutesStr}:${secondsStr} ${ampm}`;
  };

  // Inline container styling (prefer natural size but allow shrinking)
  const containerStyle = {};
  if (containerSize.width && containerSize.height) {
    containerStyle.width = containerSize.width + 'px';
    containerStyle.height = containerSize.height + 'px';
    containerStyle.maxWidth = '100%';
  } else {
    containerStyle.width = '100%';
  }

  const transitionStyle = {
    transition: `opacity ${FADE_DURATION_MS}ms cubic-bezier(0.4,0,0.2,1)`
  };

  return (
    <div className="page-wrapper" onClick={handleClick}>
      <div className="stack-wrapper" aria-live="polite">
        {/* Upper static image */}
        <div className="upper-block">
          <img src={upperSrc} alt="Upper part" className="responsive-img"/>
        </div>

        {/* Dynamic date and time */}
        <div className="time-block">
          <div className="time-display">
            <span className="date-text">{formatDate(currentTime)}</span>
            <span className="time-text">{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Bottom carousel */}
        <div
          className="carousel-container"
          style={containerStyle}
          role="region"
          aria-roledescription="carousel"
          aria-label="Bottom images carousel"
        >
          {uniqueImgs.map((src) => {
            const isActive = sequence[idx] === src;
            return (
              <div
                key={src}
                className={`carousel-slide ${isActive ? 'active' : ''}`}
                style={{ ...transitionStyle, pointerEvents: isActive ? 'auto' : 'none' }}
                aria-hidden={!isActive}
              >
                <img src={src} alt="carousel" className="responsive-img carousel-img" />
              </div>
            );
          })}
          
          {/* Click overlay - only over carousel */}
          {showClickOverlay && (
            <div className="click-overlay">
              <img src={require('../assets/IMG_click.jpg')} alt="Click overlay" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
