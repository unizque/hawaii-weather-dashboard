export type FrameLoopStatus = 'idle' | 'loading' | 'ready' | 'current-only' | 'unavailable';

export interface FrameLoopController {
  frameTime: string | null;
  frames: string[];
  frameIndex: number;
  isPlaying: boolean;
  status: FrameLoopStatus;
  error: string | null;
  togglePlayback: () => void;
  seek: (index: number) => void;
}
