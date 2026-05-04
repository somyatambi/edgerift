/**
 * SimulatorTrade.tsx
 * Features:
 *  - Live intra-candle animation (series.update every 800 ms)
 *  - Meme-coin pair names (ASHVOL / PEPDRG), per-pair timeframe selector
 *  - Indicator toolbar: Volume, EMA 9, EMA 21, SMA 50, RSI 14 (sub-chart)
 *  - Drawing toolbar: Cursor, Trendline, Horizontal Line, Rectangle, Ruler, Erase
 *  - SL / TP shown in trade history
 */

import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createChart,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type IPriceLine,
  ColorType,
} from 'lightweight-charts';
import {
  TrendingUp, TrendingDown, X, AlertTriangle,
  Trophy, RefreshCw, WifiOff,
  MousePointer, Minus, Square, Ruler, Eraser, Trash2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface Position {
  id: number;
  pair: string;
  direction: 'long' | 'short';
  entry_price: number;
  size: number;
  stop_loss: number | null;
  take_profit: number | null;
  status: string;
  pnl: number;
}

interface Challenge {
  id: number;
  tier: string;
  status: 'active' | 'passed' | 'failed';
  initial_balance: number;
  current_balance: number;
  peak_balance: number;
  daily_start_balance: number;
  trading_days_count: number;
}

interface IndicatorState {
  volume: boolean;
  ema9:   boolean;
  ema21:  boolean;
  sma50:  boolean;
  rsi:    boolean;
}

type DrawingToolType = 'none' | 'trendline' | 'hline' | 'rectangle' | 'ruler' | 'erase';

interface DrawingPoint { time: number; price: number; }

interface Drawing {
  id:     string;
  type:   Exclude<DrawingToolType, 'none' | 'erase'>;
  points: DrawingPoint[];
  color:  string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, {
  profitTarget: number; minTradingDays: number;
  maxTotalDrawdown: number; maxDailyLoss: number;
}> = {
  starter: { profitTarget: 0.08, minTradingDays: 3,  maxTotalDrawdown: 0.08, maxDailyLoss: 0.04 },
  pro:     { profitTarget: 0.08, minTradingDays: 5,  maxTotalDrawdown: 0.10, maxDailyLoss: 0.04 },
  elite:   { profitTarget: 0.10, minTradingDays: 7,  maxTotalDrawdown: 0.12, maxDailyLoss: 0.05 },
};

interface PairConfig {
  label: string; ticker: string; value: string;
  intervals: string[]; color: string;
}

const PAIRS: PairConfig[] = [
  { label: 'ASH VOLCANO', ticker: 'ASHVOL', value: 'BTCUSDT', intervals: ['5m', '15m'], color: '#ff6b35' },
  { label: 'PEPE DRAGON', ticker: 'PEPDRG', value: 'ETHUSDT', intervals: ['5m'],        color: '#a855f7' },
];

const PAIR_TICKER: Record<string, string> = Object.fromEntries(PAIRS.map(p => [p.value, p.ticker]));

const GREEN = '#00ffc8';
const RED   = '#f87171';
const DIM   = 'rgba(255,255,255,0.32)';
const BG    = '#030a14';

const fmt    = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const fmtP   = (n: number) => n >= 1000 ? n.toFixed(1) : n.toFixed(2);
const clamp  = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ─── Indicator calculations (pure, run each render) ──────────────────────────

function calcEMA(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period) return result;
  const k = 2 / (period + 1);
  const closes = candles.map(c => c.close);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = ema;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}

function calcSMA(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period) return result;
  const closes = candles.map(c => c.close);
  for (let i = period - 1; i < closes.length; i++) {
    const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result[i] = sum / period;
  }
  return result;
}

function calcRSI(candles: Candle[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period) return result;
  const closes = candles.map(c => c.close);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses += -d;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

// ─── TV chart theme ───────────────────────────────────────────────────────────

const TV_THEME = {
  layout: { background: { type: ColorType.Solid, color: 'rgba(7,17,31,0)' }, textColor: 'rgba(255,255,255,0.45)' },
  grid:   { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: 'rgba(255,255,255,0.25)', width: 1 as const, style: 1 as const, labelBackgroundColor: '#00ffc8' },
    horzLine: { color: 'rgba(255,255,255,0.25)', width: 1 as const, style: 1 as const, labelBackgroundColor: '#00ffc8' },
  },
  rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)', textColor: 'rgba(255,255,255,0.4)' },
  timeScale: { borderColor: 'rgba(255,255,255,0.08)', textColor: 'rgba(255,255,255,0.35)', timeVisible: true, secondsVisible: false },
};

const CANDLE_COLORS = {
  upColor: GREEN, downColor: RED,
  borderUpColor: GREEN, borderDownColor: RED,
  wickUpColor: 'rgba(0,255,200,0.6)', wickDownColor: 'rgba(248,113,113,0.6)',
};

// ─── TradingView Chart (self-contained with indicators + drawing tools) ────────

interface TVChartProps {
  candles:    Candle[];
  liveCandle: Candle | null;
  positions:  Position[];
  fetchError: string;
}

function TVChart({ candles, liveCandle, positions, fetchError }: TVChartProps) {
  // Chart instances
  const containerRef    = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const chartRef        = useRef<IChartApi | null>(null);
  const rsiChartRef     = useRef<IChartApi | null>(null);

  // Series refs
  const seriesRef    = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volRef       = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema9Ref      = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21Ref     = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50Ref     = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const priceLines   = useRef<Map<number, IPriceLine>>(new Map());

  // Sync state
  const lastCountRef = useRef(0);
  const [svgW, setSvgW] = useState(0);
  const [svgH, setSvgH] = useState(0);
  const [tick, setTick] = useState(0); // incremented on chart pan to re-render SVG

  // Indicators
  const [ind, setInd] = useState<IndicatorState>({
    volume: false, ema9: false, ema21: false, sma50: false, rsi: false,
  });
  const toggleInd = (k: keyof IndicatorState) => setInd(p => ({ ...p, [k]: !p[k] }));

  // Drawing tools
  const [tool, setTool]     = useState<DrawingToolType>('none');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [wip, setWip]       = useState<{ type: Drawing['type']; points: DrawingPoint[]; color: string } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const changeTool = (t: DrawingToolType) => { setTool(t); setWip(null); setCursor(null); };

  // ── Create charts once ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      ...TV_THEME,
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    const series = chart.addSeries(CandlestickSeries, CANDLE_COLORS);

    // Volume – hidden by default, occupies bottom 20% of pane
    const vol = chart.addSeries(HistogramSeries, {
      priceScaleId: 'vol', visible: false,
      priceFormat: { type: 'volume' as const },
    });
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const ema9  = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1 as const, visible: false, priceLineVisible: false, lastValueVisible: false });
    const ema21 = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1 as const, visible: false, priceLineVisible: false, lastValueVisible: false });
    const sma50 = chart.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 1 as const, visible: false, priceLineVisible: false, lastValueVisible: false });

    chartRef.current = chart;
    seriesRef.current = series;
    volRef.current = vol;
    ema9Ref.current = ema9;
    ema21Ref.current = ema21;
    sma50Ref.current = sma50;

    // RSI sub-chart (always created, container height controls visibility)
    if (rsiContainerRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, {
        layout: { background: { type: ColorType.Solid, color: 'rgba(4,9,20,0.97)' }, textColor: 'rgba(255,255,255,0.35)' },
        grid:   { vertLines: { color: 'rgba(255,255,255,0.02)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)', textColor: 'rgba(255,255,255,0.3)' },
        timeScale: { visible: false, borderColor: 'rgba(255,255,255,0.08)' },
        crosshair: { mode: CrosshairMode.Normal },
        handleScroll: { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false },
        handleScale:  { mouseWheel: false, axisPressedMouseMove: false, pinch: false },
        width:  rsiContainerRef.current.clientWidth,
        height: rsiContainerRef.current.clientHeight,
      });
      const rsiLine = rsiChart.addSeries(LineSeries, {
        color: '#f59e0b', lineWidth: 1.5 as const,
        priceLineVisible: false, lastValueVisible: true,
      });
      rsiLine.createPriceLine({ price: 70, color: 'rgba(248,113,113,0.5)', lineWidth: 1 as const, lineStyle: 1 as const, axisLabelVisible: false });
      rsiLine.createPriceLine({ price: 30, color: 'rgba(0,255,200,0.5)',   lineWidth: 1 as const, lineStyle: 1 as const, axisLabelVisible: false });
      rsiLine.createPriceLine({ price: 50, color: 'rgba(255,255,255,0.12)', lineWidth: 1 as const, lineStyle: 1 as const, axisLabelVisible: false });
      rsiChartRef.current  = rsiChart;
      rsiSeriesRef.current = rsiLine;
    }

    // Re-render SVG drawings on pan/zoom
    const onRange = () => setTick(k => k + 1);
    chart.timeScale().subscribeVisibleTimeRangeChange(onRange);

    // Resize observer covers both chart containers
    const obs = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target as HTMLElement;
        const w  = el.clientWidth;
        const h  = el.clientHeight;
        if (el === containerRef.current) {
          chartRef.current?.resize(w, h);
          setSvgW(w); setSvgH(h);
        }
        if (el === rsiContainerRef.current) {
          rsiChartRef.current?.resize(w, h);
        }
      });
    });
    if (containerRef.current)    obs.observe(containerRef.current);
    if (rsiContainerRef.current) obs.observe(rsiContainerRef.current);

    // Initial SVG size
    setSvgW(containerRef.current.clientWidth);
    setSvgH(containerRef.current.clientHeight);

    return () => {
      obs.disconnect();
      chart.timeScale().unsubscribeVisibleTimeRangeChange(onRange);
      chart.remove(); chartRef.current = null; seriesRef.current = null;
      volRef.current = null; ema9Ref.current = null; ema21Ref.current = null; sma50Ref.current = null;
      rsiChartRef.current?.remove(); rsiChartRef.current = null; rsiSeriesRef.current = null;
    };
  }, []);

  // ── Clear everything on pair switch (candles → []) ─────────────────────────
  useEffect(() => {
    if (candles.length > 0) return;
    lastCountRef.current = 0;
    setDrawings([]); setWip(null);
    seriesRef.current?.setData([]);
    volRef.current?.setData([]);
    ema9Ref.current?.setData([]);
    ema21Ref.current?.setData([]);
    sma50Ref.current?.setData([]);
    rsiSeriesRef.current?.setData([]);
  }, [candles.length]);

  // ── Completed candle data (setData only when count grows) ─────────────────
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;
    if (candles.length === lastCountRef.current) return;
    const seen  = new Set<number>();
    const tvData: CandlestickData[] = [];
    for (const c of candles) {
      const t = Math.floor(c.time / 1000);
      if (seen.has(t)) continue;
      seen.add(t);
      tvData.push({ time: t as any, open: c.open, high: c.high, low: c.low, close: c.close });
    }
    seriesRef.current.setData(tvData);
    if (lastCountRef.current === 0) chartRef.current?.timeScale().scrollToRealTime();
    lastCountRef.current = candles.length;
  }, [candles]);

  // ── Live candle animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || !liveCandle) return;
    try {
      seriesRef.current.update({
        time:  Math.floor(liveCandle.time / 1000) as any,
        open:  liveCandle.open, high: liveCandle.high,
        low:   liveCandle.low,  close: liveCandle.close,
      });
    } catch { /* ignore timing errors during pair switch */ }
  }, [liveCandle]);

  // ── Volume ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!volRef.current) return;
    volRef.current.applyOptions({ visible: ind.volume });
    if (!ind.volume || candles.length === 0) return;
    volRef.current.setData(candles.map(c => ({
      time:  Math.floor(c.time / 1000) as any,
      value: c.volume ?? 0,
      color: c.close >= c.open ? 'rgba(0,255,200,0.25)' : 'rgba(248,113,113,0.25)',
    })));
  }, [ind.volume, candles]);

  // ── EMA 9 ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ema9Ref.current) return;
    ema9Ref.current.applyOptions({ visible: ind.ema9 });
    if (!ind.ema9 || candles.length < 9) return;
    const v = calcEMA(candles, 9);
    ema9Ref.current.setData(
      candles.map((c, i) => ({ time: Math.floor(c.time / 1000) as any, value: v[i]! })).filter((_, i) => v[i] !== null),
    );
  }, [ind.ema9, candles]);

  // ── EMA 21 ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ema21Ref.current) return;
    ema21Ref.current.applyOptions({ visible: ind.ema21 });
    if (!ind.ema21 || candles.length < 21) return;
    const v = calcEMA(candles, 21);
    ema21Ref.current.setData(
      candles.map((c, i) => ({ time: Math.floor(c.time / 1000) as any, value: v[i]! })).filter((_, i) => v[i] !== null),
    );
  }, [ind.ema21, candles]);

  // ── SMA 50 ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sma50Ref.current) return;
    sma50Ref.current.applyOptions({ visible: ind.sma50 });
    if (!ind.sma50 || candles.length < 50) return;
    const v = calcSMA(candles, 50);
    sma50Ref.current.setData(
      candles.map((c, i) => ({ time: Math.floor(c.time / 1000) as any, value: v[i]! })).filter((_, i) => v[i] !== null),
    );
  }, [ind.sma50, candles]);

  // ── RSI 14 ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!rsiSeriesRef.current || !ind.rsi || candles.length <= 14) return;
    const v = calcRSI(candles, 14);
    rsiSeriesRef.current.setData(
      candles.map((c, i) => ({ time: Math.floor(c.time / 1000) as any, value: v[i]! })).filter((_, i) => v[i] !== null),
    );
    // Sync RSI time range with main chart
    const range = chartRef.current?.timeScale().getVisibleRange();
    if (range) rsiChartRef.current?.timeScale().setVisibleRange(range);
  }, [ind.rsi, candles]);

  // Sync RSI on main chart pan/zoom
  useEffect(() => {
    if (!ind.rsi || !rsiChartRef.current || !chartRef.current) return;
    const range = chartRef.current.timeScale().getVisibleRange();
    if (range) rsiChartRef.current.timeScale().setVisibleRange(range);
  }, [tick, ind.rsi]);

  // Resize RSI chart when panel becomes visible
  useEffect(() => {
    if (!ind.rsi || !rsiContainerRef.current || !rsiChartRef.current) return;
    requestAnimationFrame(() => {
      if (rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.resize(rsiContainerRef.current.clientWidth, rsiContainerRef.current.clientHeight || 110);
      }
    });
  }, [ind.rsi]);

  // ── Position price lines ───────────────────────────────────────────────────
  useEffect(() => {
    const s = seriesRef.current;
    if (!s) return;
    const posIds = new Set(positions.map(p => p.id));
    priceLines.current.forEach((line, id) => {
      if (!posIds.has(Math.floor(id / 10))) { s.removePriceLine(line); priceLines.current.delete(id); }
    });
    positions.forEach(pos => {
      const ek = pos.id * 10;
      if (!priceLines.current.has(ek)) {
        priceLines.current.set(ek, s.createPriceLine({ price: pos.entry_price, color: pos.direction === 'long' ? GREEN : RED, lineWidth: 1 as const, lineStyle: 2 as const, axisLabelVisible: true, title: `${pos.direction === 'long' ? '▲' : '▼'} Entry` }));
      }
      if (pos.stop_loss && !priceLines.current.has(pos.id * 10 + 1)) {
        priceLines.current.set(pos.id * 10 + 1, s.createPriceLine({ price: pos.stop_loss, color: '#ef4444', lineWidth: 1 as const, lineStyle: 1 as const, axisLabelVisible: true, title: 'SL' }));
      }
      if (pos.take_profit && !priceLines.current.has(pos.id * 10 + 2)) {
        priceLines.current.set(pos.id * 10 + 2, s.createPriceLine({ price: pos.take_profit, color: '#22c55e', lineWidth: 1 as const, lineStyle: 1 as const, axisLabelVisible: true, title: 'TP' }));
      }
    });
  }, [positions]);

  // ── Drawing coordinate helpers ─────────────────────────────────────────────
  // tick in deps ensures re-evaluation after chart pan/zoom
  const ptToPx = useCallback((pt: DrawingPoint): { x: number; y: number } | null => {
    const x = chartRef.current?.timeScale().timeToCoordinate(Math.floor(pt.time / 1000) as any);
    const y = seriesRef.current?.priceToCoordinate(pt.price);
    if (x == null || y == null) return null;
    return { x, y };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const pxToPt = useCallback((x: number, y: number): DrawingPoint | null => {
    const time  = chartRef.current?.timeScale().coordinateToTime(x);
    const price = seriesRef.current?.coordinateToPrice(y);
    if (time == null || price == null) return null;
    return { time: (time as number) * 1000, price };
  }, []);

  const svgXY = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // ── Drawing event handlers ─────────────────────────────────────────────────
  const handleSvgMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    setCursor(svgXY(e));
  }, []);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const { x, y } = svgXY(e);
    const pt = pxToPt(x, y);
    if (!pt) return;

    if (tool === 'hline') {
      setDrawings(prev => [...prev, { id: crypto.randomUUID(), type: 'hline', points: [pt], color: '#3b82f6' }]);
      return;
    }

    const isDrawingTool = (t: string): t is Drawing['type'] =>
      t === 'trendline' || t === 'rectangle' || t === 'ruler';

    if (isDrawingTool(tool)) {
      if (!wip) {
        setWip({ type: tool, points: [pt], color: tool === 'ruler' ? '#f59e0b' : '#3b82f6' });
      } else {
        setDrawings(prev => [...prev, { id: crypto.randomUUID(), type: wip.type, points: [...wip.points, pt], color: wip.color }]);
        setWip(null);
        changeTool('none');
      }
    }
  }, [tool, wip, pxToPt]);

  const delDrawing = useCallback((id: string) => setDrawings(p => p.filter(d => d.id !== id)), []);

  // ── SVG drawing renderer ───────────────────────────────────────────────────
  const renderSVGDrawings = () => {
    // Build preview drawing from wip + cursor position
    const cursorPt = cursor ? pxToPt(cursor.x, cursor.y) : null;
    const preview: Drawing | null = (wip && cursorPt)
      ? { id: '__wip__', type: wip.type, points: [...wip.points, cursorPt], color: wip.color }
      : null;

    const all: Drawing[] = [...drawings, ...(preview ? [preview] : [])];

    return all.map(d => {
      const isPrev = d.id === '__wip__';
      const canDel = !isPrev && tool === 'erase';
      const dashArray = isPrev ? '5,3' : undefined;

      if (d.type === 'trendline' || d.type === 'ruler') {
        if (d.points.length < 2) return null;
        const a = ptToPx(d.points[0]);
        const b = ptToPx(d.points[1]);
        if (!a || !b) return null;

        if (d.type === 'ruler') {
          const dp  = d.points[1].price - d.points[0].price;
          const pct = (dp / d.points[0].price) * 100;
          const mx  = (a.x + b.x) / 2;
          const my  = (a.y + b.y) / 2;
          const label = `${dp >= 0 ? '+' : ''}${fmtP(dp)}  ${dp >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
          return (
            <g key={d.id} style={{ pointerEvents: 'none' }}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={d.color} strokeWidth={1.5} strokeDasharray={dashArray} />
              <circle cx={a.x} cy={a.y} r={3} fill={d.color} />
              <circle cx={b.x} cy={b.y} r={3} fill={d.color} />
              <rect x={mx - 62} y={my - 12} width={124} height={18} rx={3} fill="rgba(3,10,20,0.88)" stroke={d.color} strokeWidth={0.5} />
              <text x={mx} y={my + 1} textAnchor="middle" dominantBaseline="middle" fill={d.color} fontSize={10} fontFamily="monospace">{label}</text>
            </g>
          );
        }

        return (
          <g key={d.id} style={{ pointerEvents: canDel ? 'all' : 'none', cursor: canDel ? 'pointer' : undefined }}
            onClick={canDel ? () => delDrawing(d.id) : undefined}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={d.color} strokeWidth={isPrev ? 1 : 1.5} strokeDasharray={dashArray} />
            {!isPrev && <><circle cx={a.x} cy={a.y} r={3} fill={d.color} /><circle cx={b.x} cy={b.y} r={3} fill={d.color} /></>}
          </g>
        );
      }

      if (d.type === 'hline') {
        const p = ptToPx(d.points[0]);
        if (!p) return null;
        const priceLabel = d.points[0].price.toFixed(2);
        return (
          <g key={d.id} style={{ pointerEvents: canDel ? 'all' : 'none', cursor: canDel ? 'pointer' : undefined }}
            onClick={canDel ? () => delDrawing(d.id) : undefined}>
            <line x1={0} y1={p.y} x2={svgW} y2={p.y} stroke={d.color} strokeWidth={1} strokeDasharray={dashArray} />
            {!isPrev && (
              <>
                <rect x={svgW - 76} y={p.y - 9} width={72} height={17} rx={3} fill={`${d.color}18`} stroke={`${d.color}50`} strokeWidth={0.5} />
                <text x={svgW - 40} y={p.y + 1} textAnchor="middle" dominantBaseline="middle" fill={d.color} fontSize={10} fontFamily="monospace">{priceLabel}</text>
              </>
            )}
          </g>
        );
      }

      if (d.type === 'rectangle') {
        if (d.points.length < 2) return null;
        const a = ptToPx(d.points[0]);
        const b = ptToPx(d.points[1]);
        if (!a || !b) return null;
        const rx = Math.min(a.x, b.x), ry = Math.min(a.y, b.y);
        const rw = Math.abs(b.x - a.x), rh = Math.abs(b.y - a.y);
        return (
          <g key={d.id} style={{ pointerEvents: canDel ? 'all' : 'none', cursor: canDel ? 'pointer' : undefined }}
            onClick={canDel ? () => delDrawing(d.id) : undefined}>
            <rect x={rx} y={ry} width={rw} height={rh} stroke={d.color} strokeWidth={isPrev ? 1 : 1.5} fill={`${d.color}10`} strokeDasharray={dashArray} />
          </g>
        );
      }

      return null;
    });
  };

  // Cursor helper overlay (hline preview / crosshair dot)
  const renderCursorHelper = () => {
    if (!cursor) return null;
    if (tool === 'hline') {
      return <line x1={0} y1={cursor.y} x2={svgW} y2={cursor.y} stroke="rgba(59,130,246,0.35)" strokeWidth={1} strokeDasharray="6,3" style={{ pointerEvents: 'none' }} />;
    }
    if (tool !== 'none' && tool !== 'erase') {
      return (
        <g style={{ pointerEvents: 'none' }}>
          <line x1={cursor.x - 7} y1={cursor.y} x2={cursor.x + 7} y2={cursor.y} stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
          <line x1={cursor.x} y1={cursor.y - 7} x2={cursor.x} y2={cursor.y + 7} stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
        </g>
      );
    }
    return null;
  };

  const toolCursor = tool === 'none' ? 'default' : tool === 'erase' ? 'pointer' : 'crosshair';

  if (fetchError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ color: RED }}>
        <WifiOff className="h-8 w-8 opacity-50" />
        <p className="text-sm font-mono opacity-60">Backend server not reachable</p>
        <p className="text-xs opacity-35 text-center px-8">
          Run <code className="px-1.5 py-0.5 rounded mx-1" style={{ background: 'rgba(255,255,255,0.06)' }}>npm run dev:full</code> then refresh
        </p>
      </div>
    );
  }

  // Indicator button config
  const IND_BTNS: { key: keyof IndicatorState; label: string; color: string }[] = [
    { key: 'volume', label: 'VOL',  color: GREEN      },
    { key: 'ema9',   label: 'EMA9', color: '#f59e0b'  },
    { key: 'ema21',  label: 'EMA21',color: '#3b82f6'  },
    { key: 'sma50',  label: 'SMA50',color: '#8b5cf6'  },
    { key: 'rsi',    label: 'RSI',  color: '#f97316'  },
  ];

  // Drawing tool button config
  const TOOL_BTNS: { key: DrawingToolType; icon: React.ReactNode; title: string }[] = [
    { key: 'none',      icon: <MousePointer className="h-3 w-3" />, title: 'Cursor (pan/zoom)' },
    { key: 'trendline', icon: <TrendingUp   className="h-3 w-3" />, title: 'Trendline' },
    { key: 'hline',     icon: <Minus        className="h-3 w-3" />, title: 'Horizontal Line' },
    { key: 'rectangle', icon: <Square       className="h-3 w-3" />, title: 'Rectangle' },
    { key: 'ruler',     icon: <Ruler        className="h-3 w-3" />, title: 'Ruler / Measure' },
    { key: 'erase',     icon: <Eraser       className="h-3 w-3" />, title: 'Erase Drawing' },
  ];

  return (
    <div className="flex flex-col h-full">

      {/* ── Indicator + Tool toolbar ─────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-1.5 px-3 overflow-x-auto"
        style={{ height: 38, background: 'rgba(4,9,20,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}
      >
        {/* Indicators */}
        <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Indicators
        </span>
        {IND_BTNS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggleInd(key)}
            className="shrink-0 h-6 px-2 rounded text-[10px] font-bold transition-all"
            style={{
              background: ind[key] ? `${color}18` : 'rgba(255,255,255,0.04)',
              color:      ind[key] ? color : 'rgba(255,255,255,0.3)',
              border:     ind[key] ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {label}
          </button>
        ))}

        <div className="shrink-0 w-px h-4 mx-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Drawing tools */}
        <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Draw
        </span>
        {TOOL_BTNS.map(({ key, icon, title }) => (
          <button
            key={key}
            title={title}
            onClick={() => changeTool(key)}
            className="shrink-0 h-6 w-7 flex items-center justify-center rounded transition-all"
            style={{
              background: tool === key ? 'rgba(0,255,200,0.1)'  : 'rgba(255,255,255,0.04)',
              color:      tool === key ? GREEN : 'rgba(255,255,255,0.38)',
              border:     tool === key ? '1px solid rgba(0,255,200,0.28)' : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {icon}
          </button>
        ))}

        {/* Clear all button */}
        {drawings.length > 0 && (
          <>
            <div className="shrink-0 w-px h-4 mx-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <button
              onClick={() => setDrawings([])}
              title="Clear all drawings"
              className="shrink-0 h-6 px-2 flex items-center gap-1 rounded text-[10px] transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Trash2 className="h-2.5 w-2.5" /> {drawings.length}
            </button>
          </>
        )}

        {/* Indicator legend */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {ind.ema9  && <span className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>EMA9</span>}
          {ind.ema21 && <span className="text-[10px] font-bold" style={{ color: '#3b82f6' }}>EMA21</span>}
          {ind.sma50 && <span className="text-[10px] font-bold" style={{ color: '#8b5cf6' }}>SMA50</span>}
        </div>
      </div>

      {/* ── Main chart with SVG drawing overlay ─────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {/* SVG Drawing Overlay */}
        <svg
          style={{
            position: 'absolute', top: 0, left: 0,
            width: svgW, height: svgH, overflow: 'hidden',
            pointerEvents: tool !== 'none' ? 'all' : 'none',
            cursor: toolCursor,
          }}
          onMouseMove={handleSvgMove}
          onClick={handleSvgClick}
          onMouseLeave={() => setCursor(null)}
        >
          {renderSVGDrawings()}
          {renderCursorHelper()}
        </svg>
      </div>

      {/* ── RSI sub-chart (collapsible) ──────────────────────────────────── */}
      <div
        style={{
          height: ind.rsi ? 110 : 0, overflow: 'hidden',
          transition: 'height 0.15s ease',
          borderTop: ind.rsi ? '1px solid rgba(255,255,255,0.07)' : 'none',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {ind.rsi && (
          <span className="absolute top-1 left-3 text-[9px] font-bold"
            style={{ color: '#f97316', letterSpacing: '0.05em', zIndex: 1, pointerEvents: 'none' }}>
            RSI 14
          </span>
        )}
        <div ref={rsiContainerRef} style={{ width: '100%', height: 110 }} />
      </div>
    </div>
  );
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0"
      style={{ background: color ? `${color}18` : 'rgba(255,255,255,0.06)', color: color ?? 'rgba(255,255,255,0.4)', border: `1px solid ${color ? `${color}40` : 'rgba(255,255,255,0.1)'}` }}>
      {children}
    </span>
  );
}

function Modal({ children, borderColor }: { children: React.ReactNode; borderColor: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(3,10,20,0.93)', backdropFilter: 'blur(16px)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{ background: 'rgba(7,17,31,0.99)', border: `1px solid ${borderColor}` }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SimulatorTrade() {
  const navigate  = useNavigate();
  const { token } = useAuth();

  const [candles,      setCandles]      = useState<Candle[]>([]);
  const [liveCandle,   setLiveCandle]   = useState<Candle | null>(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [pairPrices,   setPairPrices]   = useState<Record<string, number>>({});
  const [challenge,    setChallenge]    = useState<Challenge | null>(null);
  const [positions,    setPositions]    = useState<Position[]>([]);
  const [trades,       setTrades]       = useState<any[]>([]);
  const [activeTab,    setActiveTab]    = useState<'positions' | 'history'>('positions');

  const [selectedPairValue, setSelectedPairValue] = useState(PAIRS[0].value);
  const [selectedInterval,  setSelectedInterval]  = useState(PAIRS[0].intervals[0]);
  const selectedPairConfig = PAIRS.find(p => p.value === selectedPairValue) ?? PAIRS[0];

  const [fetchError,   setFetchError]   = useState('');
  const [connected,    setConnected]    = useState(true);
  const failCount   = useRef(0);
  const hasStopped  = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [direction,    setDirection]    = useState<'long' | 'short'>('long');
  const [size,         setSize]         = useState('');
  const [stopLoss,     setStopLoss]     = useState('');
  const [takeProfit,   setTakeProfit]   = useState('');
  const [orderError,   setOrderError]   = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [closeLoading, setCloseLoading] = useState<number | null>(null);
  const [closeErrors,  setCloseErrors]  = useState<Record<number, string>>({});
  const [editingId,    setEditingId]    = useState<number | null>(null);
  const [editSL,       setEditSL]       = useState('');
  const [editTP,       setEditTP]       = useState('');
  const [modifyLoading, setModifyLoading] = useState(false);
  const [modifyError,   setModifyError]   = useState('');
  const [showPassed, setShowPassed] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [failReason, setFailReason] = useState('');

  const authHeaders = useCallback(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
    [token],
  );

  // ── Initial challenge load ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { navigate('/auth'); return; }
    fetch('/api/simulator/challenge', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.challenge) { setChallenge(data.challenge); setPositions(data.positions || []); setCurrentPrice(data.currentPrice || 0); }
        else navigate('/simulator');
      }).catch(() => {});
  }, [token]);

  // ── Candle polling (800 ms) ────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/simulator/candles?pair=${selectedPairValue}&interval=${selectedInterval}&limit=200`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        failCount.current = 0; setConnected(true); setFetchError('');

        if (data.candles)    setCandles(data.candles);
        if (data.liveCandle) setLiveCandle(data.liveCandle);
        if (data.currentPrice) { setCurrentPrice(data.currentPrice); setPairPrices(prev => ({ ...prev, [selectedPairValue]: data.currentPrice })); }
        if (data.positions) setPositions(data.positions);
        if (data.challenge) {
          setChallenge(data.challenge);
          if (data.challenge.status === 'passed' && !hasStopped.current) {
            hasStopped.current = true; setShowPassed(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          if (data.challenge.status === 'failed' && !hasStopped.current) {
            hasStopped.current = true; setShowFailed(true);
            setFailReason('Daily loss or total drawdown limit exceeded.');
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        }
      } catch {
        failCount.current += 1;
        if (failCount.current >= 5) { setConnected(false); setFetchError('backend_unreachable'); }
      }
    };
    setCandles([]); setLiveCandle(null); poll();
    intervalRef.current = setInterval(poll, 800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [token, selectedPairValue, selectedInterval]);

  // ── Trade history ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'history' || !token) return;
    fetch('/api/simulator/trades', { headers: authHeaders() }).then(r => r.json()).then(d => { if (d.trades) setTrades(d.trades); }).catch(() => {});
    const id = setInterval(() => {
      fetch('/api/simulator/trades', { headers: authHeaders() }).then(r => r.json()).then(d => { if (d.trades) setTrades(d.trades); }).catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [activeTab, token]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const cfg           = challenge ? TIER_CONFIG[challenge.tier] : null;
  const balancePnl    = challenge ? challenge.current_balance - challenge.initial_balance : 0;
  const balancePnlPct = challenge ? (balancePnl / challenge.initial_balance) * 100 : 0;
  const dailyPnl      = challenge ? challenge.current_balance - challenge.daily_start_balance : 0;
  const drawdown      = challenge && challenge.peak_balance > 0 ? ((challenge.peak_balance - challenge.current_balance) / challenge.peak_balance) * 100 : 0;
  const progress      = cfg ? clamp((balancePnlPct / (cfg.profitTarget * 100)) * 100, 0, 100) : 0;
  const dailyLossPct  = dailyPnl < 0 && challenge ? (-dailyPnl / challenge.daily_start_balance) * 100 : 0;
  const tradingDays   = challenge?.trading_days_count ?? 0;
  const visiblePositions = positions.filter(p => p.pair === selectedPairValue);

  const unrealizedPnl = (pos: Position) => {
    const price = pairPrices[pos.pair] || (pos.pair === selectedPairValue ? currentPrice : 0);
    if (!price) return null;
    return pos.direction === 'long' ? (price - pos.entry_price) * pos.size : (pos.entry_price - price) * pos.size;
  };

  // ── Place order ────────────────────────────────────────────────────────────
  const handleOrder = async () => {
    const sizeNum = Number(size);
    if (!size || isNaN(sizeNum) || sizeNum <= 0) { setOrderError('Enter a valid size greater than 0.'); return; }
    if (challenge?.status !== 'active')           { setOrderError('Challenge is not active.'); return; }
    setOrderLoading(true); setOrderError('');
    try {
      const body: Record<string, any> = { direction, size: sizeNum, pair: selectedPairValue, interval: selectedInterval };
      if (stopLoss   && !isNaN(Number(stopLoss)))  body.stopLoss   = Number(stopLoss);
      if (takeProfit && !isNaN(Number(takeProfit))) body.takeProfit = Number(takeProfit);
      const res = await fetch('/api/simulator/order', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      let data: any = {}; try { data = await res.json(); } catch { /**/ }
      if (!res.ok) { setOrderError(data.error || `Server error (${res.status}).`); return; }
      setSize(''); setStopLoss(''); setTakeProfit(''); setOrderError('');
      if (data.challenge) setChallenge(data.challenge);
      if (Array.isArray(data.positions)) setPositions(data.positions);
      else if (data.position) setPositions(prev => [...prev, data.position]);
    } catch (err: any) {
      setOrderError(err?.message?.includes('fetch') ? 'Cannot reach server.' : (err?.message || 'Order failed.'));
    } finally { setOrderLoading(false); }
  };

  // ── Close position ─────────────────────────────────────────────────────────
  const handleClose = async (positionId: number) => {
    if (closeLoading !== null) return;
    setCloseLoading(positionId); setCloseErrors(prev => ({ ...prev, [positionId]: '' }));
    try {
      const res = await fetch(`/api/simulator/close/${positionId}`, { method: 'POST', headers: authHeaders() });
      let data: any = {}; try { data = await res.json(); } catch { /**/ }
      if (!res.ok) { setCloseErrors(prev => ({ ...prev, [positionId]: data.error || `Error (${res.status}).` })); return; }
      if (data.challenge) setChallenge(data.challenge);
      if (Array.isArray(data.positions)) setPositions(data.positions);
      else setPositions(prev => prev.filter(p => p.id !== positionId));
    } catch (err: any) {
      setCloseErrors(prev => ({ ...prev, [positionId]: err?.message || 'Unknown error.' }));
    } finally { setCloseLoading(null); }
  };

  // ── Modify SL/TP ───────────────────────────────────────────────────────────
  const handleModify = async (positionId: number) => {
    setModifyLoading(true); setModifyError('');
    try {
      const body = { stopLoss: editSL === '' ? null : Number(editSL), takeProfit: editTP === '' ? null : Number(editTP) };
      const res = await fetch(`/api/simulator/position/${positionId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) });
      let data: any = {}; try { data = await res.json(); } catch { /**/ }
      if (!res.ok) { setModifyError(data.error || `Error (${res.status})`); return; }
      if (Array.isArray(data.positions)) setPositions(data.positions);
      setEditingId(null);
    } catch (err: any) { setModifyError(err?.message || 'Failed.'); }
    finally { setModifyLoading(false); }
  };

  if (!challenge) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: BG }}>
        <RefreshCw className="h-8 w-8 animate-spin mr-3" style={{ color: GREEN }} />
        <span className="text-sm font-mono" style={{ color: DIM }}>Loading simulator…</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 md:left-64 flex flex-col overflow-hidden" style={{ background: '#050b18' }}>

      {/* ══ TOP STATS BAR ════════════════════════════════════════════════════ */}
      <div className="shrink-0 flex items-center gap-2 px-4 h-11 overflow-x-auto"
        style={{ background: 'rgba(4,9,20,0.98)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
          style={{ background: connected ? 'rgba(0,255,200,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${connected ? 'rgba(0,255,200,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: connected ? GREEN : RED, boxShadow: `0 0 5px ${connected ? GREEN : RED}` }} />
          <span className="text-[10px] font-bold" style={{ color: connected ? GREEN : RED }}>{connected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
        <div className="w-px h-4 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.32)' }}>BAL</span>
          <span className="text-xs font-bold font-mono" style={{ color: '#e2e8f0' }}>${fmt(challenge.current_balance)}</span>
          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded" style={{ color: balancePnl >= 0 ? GREEN : RED, background: balancePnl >= 0 ? 'rgba(0,255,200,0.08)' : 'rgba(248,113,113,0.08)' }}>
            {fmtPct(balancePnlPct)}
          </span>
        </div>
        <div className="w-px h-4 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.32)' }}>DAILY</span>
          <span className="text-xs font-bold font-mono" style={{ color: dailyPnl >= 0 ? GREEN : RED }}>{dailyPnl >= 0 ? '+' : ''}${fmt(dailyPnl)}</span>
          {cfg && dailyLossPct > 0 && <span className="text-[10px] font-mono" style={{ color: dailyLossPct > cfg.maxDailyLoss * 100 * 0.75 ? RED : 'rgba(255,255,255,0.22)' }}>/ {(cfg.maxDailyLoss * 100).toFixed(0)}%</span>}
        </div>
        <div className="w-px h-4 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.32)' }}>DD</span>
          <span className="text-xs font-bold font-mono" style={{ color: drawdown > (cfg ? cfg.maxTotalDrawdown * 100 * 0.7 : 999) ? RED : '#e2e8f0' }}>{drawdown.toFixed(2)}%</span>
          {cfg && <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.22)' }}>/ {(cfg.maxTotalDrawdown * 100).toFixed(0)}%</span>}
        </div>
        <div className="w-px h-4 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.32)' }}>DAYS</span>
          <span className="text-xs font-bold font-mono" style={{ color: '#e2e8f0' }}>{tradingDays}{cfg && <span style={{ color: 'rgba(255,255,255,0.22)' }}>/{cfg.minTradingDays}</span>}</span>
        </div>
        <div className="w-px h-4 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.32)' }}>TARGET</span>
          <div className="w-20 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: progress >= 100 ? GREEN : '#3b82f6' }} />
          </div>
          <span className="text-xs font-bold font-mono" style={{ color: progress >= 100 ? GREEN : '#e2e8f0' }}>{progress.toFixed(0)}%</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge>{challenge.tier.toUpperCase()}</Badge>
          <Badge color={challenge.status === 'failed' ? RED : challenge.status === 'passed' ? GREEN : '#3b82f6'}>{challenge.status.toUpperCase()}</Badge>
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-[10px] font-bold" style={{ color: selectedPairConfig.color }}>{selectedPairConfig.ticker}</span>
            <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>{selectedInterval}</span>
            <span className="text-sm font-bold font-mono" style={{ color: GREEN }}>{currentPrice > 0 ? `$${fmtP(currentPrice)}` : '—'}</span>
          </div>
        </div>
      </div>

      {/* ══ BODY ═════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Chart + Bottom Panel ─────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">

          {/* Pair + TF toolbar */}
          <div className="shrink-0 flex items-center gap-3 px-4 h-10"
            style={{ background: 'rgba(6,12,24,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1">
              {PAIRS.map(p => (
                <button key={p.value} onClick={() => { if (p.value !== selectedPairValue) { setSelectedPairValue(p.value); setSelectedInterval(p.intervals[0]); setCandles([]); setLiveCandle(null); } }}
                  className="h-7 px-3 rounded-lg text-[11px] font-bold transition-all"
                  style={{ background: selectedPairValue === p.value ? `${p.color}18` : 'rgba(255,255,255,0.04)', color: selectedPairValue === p.value ? p.color : 'rgba(255,255,255,0.35)', border: selectedPairValue === p.value ? `1px solid ${p.color}44` : '1px solid rgba(255,255,255,0.08)' }}>
                  {p.ticker}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 border-l pl-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              {selectedPairConfig.intervals.map(tf => (
                <button key={tf} onClick={() => { if (tf !== selectedInterval) { setSelectedInterval(tf); setCandles([]); setLiveCandle(null); } }}
                  className="h-6 px-2.5 rounded text-[11px] font-bold transition-all"
                  style={{ background: selectedInterval === tf ? 'rgba(0,255,200,0.1)' : 'transparent', color: selectedInterval === tf ? GREEN : 'rgba(255,255,255,0.3)', border: selectedInterval === tf ? '1px solid rgba(0,255,200,0.25)' : '1px solid transparent' }}>
                  {tf}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)' }}>{candles.length} candles</span>
            <span className="ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.12)' }}>scroll = zoom · drag = pan</span>
          </div>

          {/* TVChart (includes indicator/tool toolbar + RSI panel) */}
          <div className="flex-1 overflow-hidden flex flex-col" style={{ background: 'rgba(5,10,20,0.9)', minHeight: 0 }}>
            <TVChart candles={candles} liveCandle={liveCandle} positions={visiblePositions} fetchError={fetchError} />
          </div>

          {/* ── Positions / History panel ── */}
          <div className="shrink-0 flex flex-col" style={{ height: 220, background: 'rgba(4,9,20,0.98)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="shrink-0 flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {(['positions', 'history'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all"
                  style={{ color: activeTab === tab ? GREEN : 'rgba(255,255,255,0.3)', borderBottom: activeTab === tab ? `2px solid ${GREEN}` : '2px solid transparent', background: activeTab === tab ? 'rgba(0,255,200,0.04)' : 'transparent' }}>
                  {tab === 'positions' ? `Open Positions (${positions.length})` : 'Trade History'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto">
              {/* Open Positions */}
              {activeTab === 'positions' && (
                positions.length === 0
                  ? <p className="text-center py-6 text-xs" style={{ color: DIM }}>No open positions — place an order to start</p>
                  : (
                    <table className="w-full text-xs">
                      <thead style={{ position: 'sticky', top: 0, background: 'rgba(4,9,20,1)', zIndex: 1 }}>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}>
                          {['Pair','Side','Size','Entry','Current','Unreal. P&L','SL','TP','Action'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-[10px] tracking-wider uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map(pos => {
                          const upnl    = unrealizedPnl(pos);
                          const upnlPct = upnl !== null && pos.entry_price * pos.size > 0 ? (upnl / (pos.entry_price * pos.size)) * 100 : null;
                          const posPrice = pairPrices[pos.pair] || (pos.pair === selectedPairValue ? currentPrice : 0);
                          const isCl   = closeLoading === pos.id;
                          const isEdit = editingId === pos.id;
                          const pCfg   = PAIRS.find(p => p.value === pos.pair);
                          return (
                            <tr key={pos.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td className="px-3 py-2 font-bold text-[10px]" style={{ color: pCfg?.color ?? '#dde6f0' }}>{pCfg?.ticker ?? pos.pair}</td>
                              <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: pos.direction === 'long' ? 'rgba(0,255,200,0.1)' : 'rgba(248,113,113,0.1)', color: pos.direction === 'long' ? GREEN : RED }}>{pos.direction}</span></td>
                              <td className="px-3 py-2" style={{ color: '#dde6f0' }}>{pos.size}</td>
                              <td className="px-3 py-2 font-mono" style={{ color: '#dde6f0' }}>${fmtP(pos.entry_price)}</td>
                              <td className="px-3 py-2 font-mono" style={{ color: '#dde6f0' }}>{posPrice > 0 ? `$${fmtP(posPrice)}` : '—'}</td>
                              <td className="px-3 py-2 font-mono font-bold" style={{ color: upnl === null ? DIM : upnl >= 0 ? GREEN : RED }}>
                                {upnl === null ? '—' : <>{upnl >= 0 ? '+' : ''}${fmt(upnl)}{upnlPct !== null && <span className="ml-1 text-[10px] opacity-60">({fmtPct(upnlPct)})</span>}</>}
                              </td>
                              <td className="px-3 py-2 font-mono" style={{ color: 'rgba(239,68,68,0.7)' }}>
                                {isEdit ? <input type="number" value={editSL} onChange={e => setEditSL(e.target.value)} placeholder="SL" className="w-20 px-1.5 py-0.5 rounded text-[11px] font-mono outline-none" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: RED }} /> : pos.stop_loss ? `$${fmtP(pos.stop_loss)}` : '—'}
                              </td>
                              <td className="px-3 py-2 font-mono" style={{ color: 'rgba(34,197,94,0.7)' }}>
                                {isEdit ? <input type="number" value={editTP} onChange={e => setEditTP(e.target.value)} placeholder="TP" className="w-20 px-1.5 py-0.5 rounded text-[11px] font-mono outline-none" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', color: GREEN }} /> : pos.take_profit ? `$${fmtP(pos.take_profit)}` : '—'}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {isEdit ? (
                                    <>
                                      <button onClick={() => handleModify(pos.id)} disabled={modifyLoading} className="px-3 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: 'rgba(0,255,200,0.12)', color: GREEN, border: '1px solid rgba(0,255,200,0.28)', cursor: modifyLoading ? 'wait' : 'pointer' }}>{modifyLoading ? '…' : 'Save'}</button>
                                      <button onClick={() => { setEditingId(null); setModifyError(''); }} className="px-2 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: 'rgba(255,255,255,0.04)', color: DIM, border: '1px solid rgba(255,255,255,0.08)' }}>✕</button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => { setEditingId(pos.id); setEditSL(pos.stop_loss != null ? String(pos.stop_loss) : ''); setEditTP(pos.take_profit != null ? String(pos.take_profit) : ''); setModifyError(''); }} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>Edit</button>
                                      <button onClick={() => handleClose(pos.id)} disabled={isCl} className="px-3 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: isCl ? 'rgba(255,255,255,0.04)' : 'rgba(239,68,68,0.12)', color: isCl ? DIM : RED, border: `1px solid ${isCl ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.28)'}`, cursor: isCl ? 'wait' : 'pointer' }}>{isCl ? 'Closing…' : 'Close'}</button>
                                    </>
                                  )}
                                </div>
                                {isEdit && modifyError && <div className="mt-0.5 text-[9px]" style={{ color: RED }}>{modifyError}</div>}
                                {!isEdit && closeErrors[pos.id] && <div className="mt-0.5 text-[9px]" style={{ color: RED }}>{closeErrors[pos.id]}</div>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )
              )}

              {/* Trade History */}
              {activeTab === 'history' && (
                trades.length === 0
                  ? <p className="text-center py-6 text-xs" style={{ color: DIM }}>No trades yet</p>
                  : (
                    <table className="w-full text-xs">
                      <thead style={{ position: 'sticky', top: 0, background: 'rgba(4,9,20,1)', zIndex: 1 }}>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}>
                          {['Action','Pair','Side','Price','Size','SL','TP','P&L','Balance After'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-[10px] tracking-wider uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map((t: any, i: number) => {
                          const ac   = t.action === 'open' ? '#3b82f6' : t.action === 'tp_hit' ? GREEN : t.action === 'sl_hit' ? RED : '#dde6f0';
                          const tPair = PAIRS.find(p => p.value === t.pair);
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td className="px-3 py-2 font-bold uppercase text-[10px] whitespace-nowrap" style={{ color: ac }}>{t.action?.replace(/_/g, ' ')}</td>
                              <td className="px-3 py-2 font-bold text-[10px]" style={{ color: tPair?.color ?? '#dde6f0' }}>{tPair?.ticker ?? t.pair}</td>
                              <td className="px-3 py-2" style={{ color: t.direction === 'long' ? GREEN : RED }}>{t.direction}</td>
                              <td className="px-3 py-2 font-mono" style={{ color: '#dde6f0' }}>${fmtP(t.price)}</td>
                              <td className="px-3 py-2" style={{ color: '#dde6f0' }}>{t.size}</td>
                              <td className="px-3 py-2 font-mono" style={{ color: 'rgba(239,68,68,0.7)' }}>{t.stop_loss ? `$${fmtP(t.stop_loss)}` : '—'}</td>
                              <td className="px-3 py-2 font-mono" style={{ color: 'rgba(34,197,94,0.7)' }}>{t.take_profit ? `$${fmtP(t.take_profit)}` : '—'}</td>
                              <td className="px-3 py-2 font-mono" style={{ color: t.pnl > 0 ? GREEN : t.pnl < 0 ? RED : DIM }}>{t.pnl ? `${t.pnl >= 0 ? '+' : ''}$${fmt(t.pnl)}` : '—'}</td>
                              <td className="px-3 py-2 font-mono" style={{ color: '#dde6f0' }}>${fmt(t.balance_after)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Order Panel ───────────────────────────────────────────── */}
        <div className="shrink-0 flex flex-col overflow-y-auto" style={{ width: 300, borderLeft: '1px solid rgba(255,255,255,0.07)', background: 'rgba(4,9,20,0.98)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-sm font-black tracking-wide" style={{ color: '#e2e8f0' }}>Place Order</h3>
            <p className="text-[10px] mt-0.5 font-bold" style={{ color: selectedPairConfig.color }}>{selectedPairConfig.label} · {selectedInterval}</p>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Long / Short toggle */}
            <div className="flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {(['long', 'short'] as const).map(dir => (
                <button key={dir} onClick={() => { setDirection(dir); setOrderError(''); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black transition-all"
                  style={{
                    background: direction === dir ? dir === 'long' ? 'linear-gradient(135deg,rgba(0,255,200,0.25),rgba(0,255,200,0.12))' : 'linear-gradient(135deg,rgba(248,113,113,0.25),rgba(248,113,113,0.12))' : 'transparent',
                    color: direction === dir ? dir === 'long' ? GREEN : RED : 'rgba(255,255,255,0.3)',
                    border: direction === dir ? `1px solid ${dir === 'long' ? 'rgba(0,255,200,0.35)' : 'rgba(248,113,113,0.35)'}` : '1px solid transparent',
                  }}>
                  {dir === 'long' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {dir === 'long' ? 'Long' : 'Short'}
                </button>
              ))}
            </div>

            {/* Market price */}
            <div className="text-center py-3 rounded-xl" style={{ background: 'linear-gradient(135deg,rgba(0,255,200,0.06),rgba(0,255,200,0.02))', border: '1px solid rgba(0,255,200,0.12)' }}>
              <div className="text-[10px] font-semibold tracking-wider uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Market Price</div>
              <div className="text-2xl font-black font-mono" style={{ color: GREEN }}>{currentPrice > 0 ? `$${fmtP(currentPrice)}` : '—'}</div>
            </div>

            {/* Size */}
            <div>
              <label className="flex justify-between text-[11px] font-semibold mb-2">
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Size (units)</span>
                {size && currentPrice > 0 && <span style={{ color: 'rgba(255,255,255,0.25)' }}>≈ ${fmt(Number(size) * currentPrice)}</span>}
              </label>
              <input type="number" value={size} placeholder="e.g. 0.01" min="0" step="0.001"
                onChange={e => { setSize(e.target.value); setOrderError(''); }}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
            </div>

            {/* Quick % */}
            {currentPrice > 0 && (
              <div className="flex gap-1.5">
                {[0.5, 1, 2, 5].map(pct => (
                  <button key={pct}
                    onClick={() => { setSize(((challenge.current_balance * pct / 100) / (currentPrice * 0.02)).toFixed(4)); setOrderError(''); }}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {pct}%
                  </button>
                ))}
              </div>
            )}

            {/* Stop Loss */}
            <div>
              <label className="flex justify-between text-[11px] font-semibold mb-2">
                <span><span style={{ color: 'rgba(239,68,68,0.8)' }}>Stop Loss</span><span style={{ color: 'rgba(255,255,255,0.25)' }}> (optional)</span></span>
                {stopLoss && currentPrice > 0 && <span style={{ color: 'rgba(239,68,68,0.7)' }}>{(((Number(stopLoss) - currentPrice) / currentPrice) * 100).toFixed(2)}%</span>}
              </label>
              <input type="number" value={stopLoss} placeholder={currentPrice > 0 ? fmtP(direction === 'long' ? currentPrice * 0.98 : currentPrice * 1.02) : 'Price'}
                onChange={e => setStopLoss(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono outline-none transition-all"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', color: '#e2e8f0' }} />
            </div>

            {/* Take Profit */}
            <div>
              <label className="flex justify-between text-[11px] font-semibold mb-2">
                <span><span style={{ color: 'rgba(34,197,94,0.8)' }}>Take Profit</span><span style={{ color: 'rgba(255,255,255,0.25)' }}> (optional)</span></span>
                {takeProfit && stopLoss && currentPrice > 0 && Math.abs(currentPrice - Number(stopLoss)) > 0 && (
                  <span style={{ color: 'rgba(34,197,94,0.7)' }}>R:R {Math.abs((Number(takeProfit) - currentPrice) / (currentPrice - Number(stopLoss))).toFixed(2)}</span>
                )}
              </label>
              <input type="number" value={takeProfit} placeholder={currentPrice > 0 ? fmtP(direction === 'long' ? currentPrice * 1.03 : currentPrice * 0.97) : 'Price'}
                onChange={e => setTakeProfit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono outline-none transition-all"
                style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)', color: '#e2e8f0' }} />
            </div>

            {/* Error */}
            {orderError && (
              <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: RED }}>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{orderError}</span>
              </div>
            )}

            {/* Submit */}
            <button onClick={handleOrder} disabled={orderLoading || challenge.status !== 'active' || !connected}
              className="w-full py-3.5 rounded-xl text-sm font-black transition-all"
              style={{
                background: challenge.status !== 'active' || !connected ? 'rgba(255,255,255,0.06)' : direction === 'long' ? 'linear-gradient(135deg,#00ffc8,#00d4a8)' : 'linear-gradient(135deg,#f87171,#ef4444)',
                color: challenge.status !== 'active' || !connected ? 'rgba(255,255,255,0.25)' : direction === 'long' ? '#030a14' : '#fff',
                opacity: orderLoading ? 0.7 : 1,
                cursor: orderLoading ? 'wait' : challenge.status !== 'active' || !connected ? 'not-allowed' : 'pointer',
              }}>
              {orderLoading ? 'Placing…' : !connected ? 'Server Offline' : challenge.status !== 'active' ? `Challenge ${challenge.status}` : `${direction === 'long' ? '▲ Buy Long' : '▼ Sell Short'}${size ? ` · ${size}` : ''}`}
            </button>

            {/* Rules */}
            {cfg && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Challenge Rules</p>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  {([['Profit target', `${(cfg.profitTarget * 100).toFixed(0)}%`], ['Daily loss limit', `${(cfg.maxDailyLoss * 100).toFixed(0)}%`], ['Max drawdown', `${(cfg.maxTotalDrawdown * 100).toFixed(0)}%`], ['Min trading days', `${cfg.minTradingDays}`], ['Max positions', '3'], ['Max risk/trade', '2%']] as [string, string][]).map(([l, v]) => (
                    <div key={l} className="flex justify-between text-[11px]">
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</span>
                      <span className="font-semibold" style={{ color: '#e2e8f0' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ PASSED MODAL ═════════════════════════════════════════════════════ */}
      {showPassed && (
        <Modal borderColor="rgba(0,255,200,0.3)">
          <Trophy className="h-16 w-16 mx-auto mb-4" style={{ color: GREEN }} />
          <h2 className="text-2xl font-black mb-2" style={{ color: '#dde6f0' }}>Challenge Passed!</h2>
          <p className="text-sm mb-6" style={{ color: DIM }}>Final profit:&nbsp;<span style={{ color: GREEN }}>{fmtPct(balancePnlPct)}</span>&nbsp;·&nbsp;Days:&nbsp;<span style={{ color: '#dde6f0' }}>{tradingDays}</span></p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/simulator/leaderboard')} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: 'rgba(0,255,200,0.1)', color: GREEN, border: '1px solid rgba(0,255,200,0.25)' }}>Leaderboard</button>
            <button onClick={() => navigate('/simulator')} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: GREEN, color: BG }}>New Challenge</button>
          </div>
        </Modal>
      )}

      {/* ══ FAILED MODAL ═════════════════════════════════════════════════════ */}
      {showFailed && (
        <Modal borderColor="rgba(239,68,68,0.3)">
          <X className="h-16 w-16 mx-auto mb-4" style={{ color: RED }} />
          <h2 className="text-2xl font-black mb-2" style={{ color: '#dde6f0' }}>Challenge Failed</h2>
          <p className="text-sm mb-3" style={{ color: RED }}>{failReason}</p>
          <div className="rounded-xl p-4 mb-6 text-left" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            {([['Final balance', `$${fmt(challenge.current_balance)}`], ['Total P&L', fmtPct(balancePnlPct)]] as [string, string][]).map(([l, v]) => (
              <div key={l} className="flex justify-between text-xs mb-1"><span style={{ color: DIM }}>{l}</span><span style={{ color: '#dde6f0' }}>{v}</span></div>
            ))}
          </div>
          <button onClick={() => navigate('/simulator')} className="w-full py-3 rounded-xl text-sm font-bold" style={{ background: RED, color: '#fff' }}>Try Again</button>
        </Modal>
      )}
    </div>
  );
}
