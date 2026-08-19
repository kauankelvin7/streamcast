import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

interface SubtitleRendererProps {
  activeCues: SubtitleCue[];
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  position?: number; // 0 to 100
}

/**
 * Premium Subtitle Renderer for Streamcast
 * Renders cues with customizable styling and animations
 */
export const SubtitleRenderer: React.FC<SubtitleRendererProps> = ({
  activeCues,
  fontSize = 100,
  textColor = '#FFFFFF',
  backgroundColor = 'rgba(0,0,0,0.7)',
  position = 10,
}) => {
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none flex flex-col items-center justify-end z-30"
      style={{ bottom: `${position}%` }}
    >
      <AnimatePresence>
        {activeCues.map((cue) => (
          <motion.div
            key={cue.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="mb-2"
          >
            <span
              className="px-4 py-1 rounded-md text-center inline-block whitespace-pre-wrap shadow-xl border border-white/5"
              style={{
                fontSize: `${fontSize}%`,
                color: textColor,
                backgroundColor: backgroundColor,
                lineHeight: '1.4',
                fontWeight: '500',
              }}
            >
              {cue.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
