import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import {
  LAB_GUIDE_STEPS,
  markGuidanceDone,
} from "../data/labGuideSteps.js";

const VIEWPORT_MARGIN = 12;
const CARD_GAP = 12;
const CARD_MAX_WIDTH = 320;

/** Scroll container for each guide target (column or page region). */
const SCROLL_CONTAINER = {
  inbox: ".lab-col-input .lab-col-scroll",
  roster: ".lab-col-input .lab-col-scroll",
  code: ".lab-col-input .lab-col-scroll",
  run: null,
  graph: ".lab-col-graph",
  pipeline: ".lab-col-graph",
  score: ".lab-col-dash .lab-col-scroll",
};

function measureRect(el) {
  const box = el.getBoundingClientRect();
  const pad = 8;
  if (box.width < 2 || box.height < 2) return null;
  return {
    top: box.top - pad,
    left: box.left - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };
}

function focusGuideTarget(targetKey) {
  const el = document.querySelector(`[data-guide="${targetKey}"]`);
  if (!el) return null;

  el.closest(".lab-col")?.scrollIntoView({
    block: "nearest",
    inline: "center",
    behavior: "auto",
  });

  const containerSel = SCROLL_CONTAINER[targetKey];
  const container = containerSel ? document.querySelector(containerSel) : null;

  if (container && container !== el) {
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
    const cr = container.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const offset = er.top - cr.top - (cr.height - er.height) / 2;
    container.scrollTop += offset;
  } else {
    el.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
  }

  return el;
}

function computeCardPosition(rect, cardWidth, cardHeight) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxW = Math.min(CARD_MAX_WIDTH, vw - VIEWPORT_MARGIN * 2);
  const w = Math.min(cardWidth || maxW, maxW);
  const h = cardHeight || 240;

  if (!rect) {
    return {
      top: Math.max(VIEWPORT_MARGIN, (vh - h) / 2),
      left: Math.max(VIEWPORT_MARGIN, (vw - w) / 2),
      width: w,
    };
  }

  const spaceBelow = vh - VIEWPORT_MARGIN - (rect.top + rect.height + CARD_GAP);
  const spaceAbove = rect.top - CARD_GAP - VIEWPORT_MARGIN;

  let top;
  if (spaceBelow >= h) {
    top = rect.top + rect.height + CARD_GAP;
  } else if (spaceAbove >= h) {
    top = rect.top - CARD_GAP - h;
  } else {
    // Not enough room beside target — dock inside viewport, prefer lower half
    top = Math.max(VIEWPORT_MARGIN, vh - h - VIEWPORT_MARGIN);
  }

  let left = rect.left + rect.width / 2 - w / 2;
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - w - VIEWPORT_MARGIN));

  top = Math.max(VIEWPORT_MARGIN, Math.min(top, vh - h - VIEWPORT_MARGIN));

  return { top, left, width: w };
}

function useTargetRect(targetKey, stepIndex, active) {
  const [rect, setRect] = useState(null);

  const measure = useCallback(() => {
    if (!active || !targetKey) {
      setRect(null);
      return;
    }
    const el = focusGuideTarget(targetKey);
    if (!el) {
      setRect(null);
      return;
    }
    setRect(measureRect(el));
  }, [active, targetKey]);

  useLayoutEffect(() => {
    if (!active || !targetKey) {
      setRect(null);
      return undefined;
    }

    measure();
    const timers = [80, 200, 450, 750].map((ms) => window.setTimeout(measure, ms));
    const raf = requestAnimationFrame(() => {
      measure();
      requestAnimationFrame(measure);
    });

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [measure, stepIndex, active, targetKey]);

  useEffect(() => {
    if (!active) return undefined;
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, measure]);

  return rect;
}

function useCardPosition(rect, stepId) {
  const cardRef = useRef(null);
  const [position, setPosition] = useState({ top: VIEWPORT_MARGIN, left: VIEWPORT_MARGIN, width: CARD_MAX_WIDTH });
  const [ready, setReady] = useState(false);

  const reposition = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    const { width, height } = card.getBoundingClientRect();
    setPosition(computeCardPosition(rect, width, height));
    setReady(true);
  }, [rect]);

  useLayoutEffect(() => {
    setReady(false);
    reposition();
    const t = window.setTimeout(reposition, 50);
    return () => window.clearTimeout(t);
  }, [reposition, stepId, rect]);

  useEffect(() => {
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [reposition]);

  return { cardRef, position, ready };
}

export default function LabGuidance({ open, onClose }) {
  const [index, setIndex] = useState(0);
  const step = LAB_GUIDE_STEPS[index];
  const isLast = index >= LAB_GUIDE_STEPS.length - 1;
  const rect = useTargetRect(step?.target, index, open);
  const { cardRef, position, ready } = useCardPosition(rect, step?.id);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const finish = useCallback(() => {
    markGuidanceDone();
    onClose?.();
  }, [onClose]);

  const next = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => i + 1);
  }, [isLast, finish]);

  if (!open || !step) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="lab-guidance-layer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-guide-title"
      >
        <button type="button" className="lab-guidance-backdrop" onClick={finish} aria-label="Skip tour" />

        {rect ? (
          <motion.div
            className="lab-guidance-spotlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
          />
        ) : null}

        <motion.div
          ref={cardRef}
          className="lab-guidance-card"
          key={step.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 8 }}
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            maxWidth: `min(${CARD_MAX_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
          }}
        >
          <div className="lab-guidance-card-head">
            <span className="lab-guidance-step">
              Step {step.step} of {LAB_GUIDE_STEPS.length}
            </span>
            <button type="button" className="lab-guidance-close" onClick={finish} aria-label="Close guide">
              <X size={16} />
            </button>
          </div>
          <h2 id="lab-guide-title">{step.title}</h2>
          <p>{step.body}</p>
          {step.hint ? <p className="lab-guidance-hint">{step.hint}</p> : null}
          {!rect ? (
            <p className="lab-guidance-warn">Scroll the middle column into view if the highlight is missing.</p>
          ) : null}
          <div className="lab-guidance-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={finish}>
              Skip tour
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={next}>
              {isLast ? "Start playing" : "Next"}
              {!isLast ? <ChevronRight size={14} /> : null}
            </button>
          </div>
          <div className="lab-guidance-dots" aria-hidden="true">
            {LAB_GUIDE_STEPS.map((s, i) => (
              <span key={s.id} className={i === index ? "active" : i < index ? "done" : ""} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
