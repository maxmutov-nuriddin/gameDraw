import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Panel } from "@/components/Panel";
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_BRUSH_SIZE, MAX_BRUSH_SIZE } from "@/game/constants";
import type { DrawingTool, RoomStatus, StrokeDoc } from "@/game/types";
import { useI18n } from "@/hooks/useI18n";
import { classNames } from "@/utils/classNames";

const PALETTE = [
  "#1a1a2e", "#e53e3e", "#dd6b20", "#d69e2e",
  "#38a169", "#0f9d8a", "#3182ce", "#6b46c1",
  "#d53f8c", "#ffffff", "#a0aec0", "#fffdf7"
];

interface CanvasBoardProps {
  isDrawer: boolean;
  canDraw: boolean;
  revision: number;
  status: RoomStatus;
  strokes: StrokeDoc[];
  maskedWord: string;
  drawerWord: string | null;
  onStroke: (stroke: {
    points: number[];
    color: string;
    size: number;
    tool: DrawingTool;
    revision: number;
    seq: number;
  }) => Promise<void>;
  onClear: () => Promise<void>;
}

function drawSegment(
  context: CanvasRenderingContext2D,
  stroke: Pick<StrokeDoc, "points" | "color" | "size" | "tool">
) {
  const { points, color, size, tool } = stroke;

  if (points.length < 4) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = size;
  context.strokeStyle = tool === "eraser" ? "rgba(0,0,0,1)" : color;
  context.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
  context.beginPath();
  context.moveTo(points[0], points[1]);

  for (let index = 2; index < points.length; index += 2) {
    context.lineTo(points[index], points[index + 1]);
  }

  context.stroke();
  context.restore();
}

function getRelativePoint(event: PointerEvent | ReactPointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const bounds = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / bounds.width;
  const scaleY = CANVAS_HEIGHT / bounds.height;

  return {
    x: (event.clientX - bounds.left) * scaleX,
    y: (event.clientY - bounds.top) * scaleY
  };
}

function WordDisplay({ maskedWord }: { maskedWord: string }) {
  const letters = maskedWord.split(" ");
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
      {letters.map((char, i) => {
        if (char === "") return <span key={i} className="mx-1 w-3" />;
        const isRevealed = char !== "_";
        return (
          <span
            key={i}
            className={classNames("word-letter", isRevealed ? "revealed" : "")}
          >
            {isRevealed ? char : ""}
          </span>
        );
      })}
    </div>
  );
}

export function CanvasBoard({
  isDrawer,
  canDraw,
  revision,
  status,
  strokes,
  maskedWord,
  drawerWord,
  onStroke,
  onClear
}: CanvasBoardProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState("#1a1a2e");
  const [tool, setTool] = useState<DrawingTool>("brush");
  const [size, setSize] = useState(DEFAULT_BRUSH_SIZE);
  const [previewPoints, setPreviewPoints] = useState<number[]>([]);
  const pointsRef = useRef<number[]>([]);
  const seqRef = useRef(0);
  const lastFlushAtRef = useRef(0);
  const drawingRef = useRef(false);

  const visibleStrokes = useMemo(
    () => strokes.filter((stroke) => stroke.revision === revision),
    [revision, strokes]
  );

  useEffect(() => {
    seqRef.current = visibleStrokes.reduce((max, stroke) => Math.max(max, stroke.seq), -1) + 1;
  }, [visibleStrokes]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.fillStyle = "#fffdf7";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    visibleStrokes.forEach((stroke) => drawSegment(context, stroke));

    if (previewPoints.length >= 4) {
      drawSegment(context, {
        points: previewPoints,
        color,
        size,
        tool
      });
    }
  }, [color, previewPoints, size, tool, visibleStrokes]);

  useEffect(() => {
    setPreviewPoints([]);
    pointsRef.current = [];
    drawingRef.current = false;
  }, [revision]);

  const flushSegment = async (force: boolean) => {
    const buffer = pointsRef.current;

    if (buffer.length < 4) {
      return;
    }

    if (!force && buffer.length < 12 && Date.now() - lastFlushAtRef.current < 70) {
      return;
    }

    let segment = force ? [...buffer] : buffer.slice(0, buffer.length - 2);

    if (segment.length === 2) {
      segment = [...segment, ...segment];
    }

    if (segment.length < 4) {
      return;
    }

    lastFlushAtRef.current = Date.now();

    const nextBuffer = force ? [] : buffer.slice(segment.length - 2);
    pointsRef.current = nextBuffer;
    setPreviewPoints(nextBuffer);

    await onStroke({
      points: segment,
      color,
      size,
      tool,
      revision,
      seq: seqRef.current++
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !canvasRef.current) {
      return;
    }

    drawingRef.current = true;
    const point = getRelativePoint(event, canvasRef.current);
    pointsRef.current = [point.x, point.y];
    setPreviewPoints([point.x, point.y, point.x, point.y]);
    canvasRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current) {
      return;
    }

    const point = getRelativePoint(event, canvasRef.current);
    pointsRef.current = [...pointsRef.current, point.x, point.y];
    setPreviewPoints([...pointsRef.current]);
    void flushSegment(false);
  };

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current) {
      return;
    }

    drawingRef.current = false;
    if (canvasRef.current.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
    void flushSegment(true).finally(() => {
      setPreviewPoints([]);
      pointsRef.current = [];
    });
  };

  return (
    <Panel className="overflow-hidden p-4 sm:p-5">
      {/* Word display */}
      <div className="mb-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          {isDrawer ? t("drawThisWord") : status === "choosing" ? t("waitingWordChoice") : t("guessTheWord")}
        </p>
        {isDrawer && drawerWord ? (
          <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
            {drawerWord}
          </h2>
        ) : status === "choosing" ? (
          <h2 className="font-display text-2xl font-semibold text-slate-400 sm:text-3xl">
            {t("waitingWordChoice")}
          </h2>
        ) : maskedWord ? (
          <WordDisplay maskedWord={maskedWord} />
        ) : (
          <h2 className="font-display text-2xl font-semibold text-slate-400 sm:text-3xl">
            {t("waitingForDrawer")}
          </h2>
        )}
      </div>

      {/* Toolbar */}
      {canDraw && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-white/60 p-2.5">
          {/* Brush / Eraser */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setTool("brush")}
              title="Brush"
              className={classNames(
                "flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all",
                tool === "brush"
                  ? "bg-navy text-white shadow-soft"
                  : "bg-white/80 text-slate-500 hover:bg-white"
              )}
            >
              🖌️
            </button>
            <button
              type="button"
              onClick={() => setTool("eraser")}
              title="Eraser"
              className={classNames(
                "flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all",
                tool === "eraser"
                  ? "bg-navy text-white shadow-soft"
                  : "bg-white/80 text-slate-500 hover:bg-white"
              )}
            >
              🧹
            </button>
          </div>

          {/* Size */}
          <div className="flex flex-1 items-center gap-2 px-1">
            <span className="text-xs font-semibold text-slate-400">{size}px</span>
            <input
              type="range"
              min={2}
              max={MAX_BRUSH_SIZE}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              className="flex-1 accent-teal"
            />
          </div>

          {/* Palette */}
          <div className="flex flex-wrap gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setColor(c); setTool("brush"); }}
                title={c}
                className={classNames(
                  "h-7 w-7 rounded-lg border-2 transition-all hover:scale-110",
                  color === c && tool === "brush"
                    ? "border-navy scale-110 shadow-soft"
                    : "border-white/80"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border-2 border-white/80 bg-white/80 text-xs transition hover:scale-110" title="Custom color">
              +
              <input
                type="color"
                value={color}
                onChange={(e) => { setColor(e.target.value); setTool("brush"); }}
                className="sr-only"
              />
            </label>
          </div>

          {/* Clear */}
          <button
            type="button"
            onClick={() => void onClear()}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-rose-50 px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
          >
            🗑️ {t("clear")}
          </button>
        </div>
      )}

      {/* Non-drawer toolbar placeholder showing word info */}
      {!canDraw && status === "drawing" && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-white/40 px-3 py-2 text-sm text-slate-500">
          <span className="text-base">👁️</span>
          <span>{t("watchingHint")}</span>
        </div>
      )}

      {/* Canvas */}
      <div className="overflow-hidden rounded-[20px] border-2 border-[#eadfcb] bg-[#fffdf7] shadow-soft">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          className={classNames(
            "block w-full touch-none bg-[#fffdf7]",
            canDraw ? "canvas-cursor" : "cursor-default"
          )}
        />
      </div>
    </Panel>
  );
}
