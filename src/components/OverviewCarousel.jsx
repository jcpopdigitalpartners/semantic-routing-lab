import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
  }),
};

export default function OverviewCarousel({
  slides,
  activeIndex,
  onIndexChange,
  label = "Overview",
  syncLabel,
}) {
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(null);
  const total = slides.length;
  const index = Math.min(Math.max(activeIndex, 0), Math.max(total - 1, 0));
  const slide = slides[index];

  const goTo = (next) => {
    if (next < 0 || next >= total || next === index) return;
    setDirection(next > index ? 1 : -1);
    onIndexChange(next);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) goTo(index + 1);
    else goTo(index - 1);
  };

  if (!total || !slide) {
    return null;
  }

  return (
    <div className="overview-carousel" data-guide="pipeline">
      <div className="overview-carousel-head">
        <span className="overview-carousel-label">{label}</span>
        <span className="overview-carousel-count">
          {index + 1} / {total}
          {syncLabel ? <em>{syncLabel}</em> : null}
        </span>
      </div>

      <div
        className="overview-carousel-viewport"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            className="overview-carousel-slide"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {slide.content}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="overview-carousel-foot">
        <button
          type="button"
          className="carousel-btn"
          onClick={() => goTo(index - 1)}
          disabled={index <= 0}
          aria-label="Previous overview"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="carousel-dots" role="tablist" aria-label="Overview slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}: ${s.title ?? s.id}`}
              className={`carousel-dot ${i === index ? "active" : ""} ${i < index ? "passed" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <button
          type="button"
          className="carousel-btn"
          onClick={() => goTo(index + 1)}
          disabled={index >= total - 1}
          aria-label="Next overview"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
