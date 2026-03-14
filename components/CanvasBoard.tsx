import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Panel } from "@/components/Panel";
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_BRUSH_SIZE, MAX_BRUSH_SIZE } from "@/game/constants";
import type { DrawingTool, RoomStatus, StrokeDoc } from "@/game/types";
import { useI18n } from "@/hooks/useI18n";
import { classNames } from "@/utils/classNames";

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
  const [color, setColor] = useState("#102542");
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

    // We stream chunked polylines instead of every pointer move to keep Firestore writes lower.
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
    <Panel className="overflow-hidden p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("sketchBoard")}</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-navy sm:text-3xl">
            {isDrawer && drawerWord
              ? t("drawWord", { word: drawerWord })
              : status === "choosing"
                ? t("waitingWordChoice")
                : maskedWord || t("waitingForDrawer")}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setTool("brush")}
            className={classNames(
              "rounded-2xl px-4 py-2 font-semibold transition",
              tool === "brush" ? "bg-navy text-white" : "bg-white text-slate-600",
              !canDraw ? "cursor-not-allowed opacity-60" : ""
            )}
          >
            {t("brush")}
          </button>
          <button
            type="button"
            disabled={!canDraw}
            onClick={() => setTool("eraser")}
            className={classNames(
              "rounded-2xl px-4 py-2 font-semibold transition",
              tool === "eraser" ? "bg-navy text-white" : "bg-white text-slate-600",
              !canDraw ? "cursor-not-allowed opacity-60" : ""
            )}
          >
            {t("eraser")}
          </button>
          <input
            type="color"
            value={color}
            disabled={!canDraw || tool === "eraser"}
            onChange={(event) => setColor(event.target.value)}
            className="h-11 w-14 cursor-pointer rounded-2xl border-0 bg-transparent p-0 disabled:cursor-not-allowed"
          />
          <input
            type="range"
            min={2}
            max={MAX_BRUSH_SIZE}
            value={size}
            disabled={!canDraw}
            onChange={(event) => setSize(Number(event.target.value))}
            className="col-span-2 w-full accent-teal sm:w-32 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            disabled={!canDraw}
            onClick={() => void onClear()}
            className="rounded-2xl bg-coral px-4 py-2 font-semibold text-white transition hover:bg-[#ef593f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("clear")}
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[28px] border border-[#eadfcb] bg-[#fffdf7] shadow-soft">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          className={classNames(
            "canvas-cursor block w-full touch-none bg-[#fffdf7]",
            canDraw ? "" : "cursor-not-allowed opacity-95"
          )}
        />
      </div>
    </Panel>
  );
}
