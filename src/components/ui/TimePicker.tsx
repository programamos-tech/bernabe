"use client";

import { useState, useRef, useEffect, useId } from "react";

interface TimePickerProps {
  value?: string | null;
  onChange?: (time: string | null) => void;
  placeholder?: string;
  id?: string;
  name?: string;
}

const HOURS_12 = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

const selectClass =
  "w-full min-w-0 cursor-pointer rounded-lg border border-gray-200/90 bg-white py-2 px-1.5 text-center text-sm font-semibold tabular-nums text-gray-900 shadow-sm transition hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:border-white/[0.16] dark:focus-visible:ring-white/20 dark:[color-scheme:dark]";

export function TimePicker({
  value,
  onChange,
  placeholder = "Seleccionar hora",
  id,
  name,
}: TimePickerProps) {
  const generatedId = useId();
  const fieldPrefix = id ?? generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState("07");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("PM");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match) {
        setHour(match[1].padStart(2, "0"));
        setMinute(match[2]);
        setPeriod(match[3].toUpperCase() as "AM" | "PM");
      }
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectTime = (h: string, m: string, p: "AM" | "PM") => {
    const timeString = `${h}:${m} ${p}`;
    onChange?.(timeString);
    setIsOpen(false);
  };

  const handleConfirm = () => {
    selectTime(hour, minute, period);
  };

  const clearTime = () => {
    onChange?.(null);
    setHour("07");
    setMinute("00");
    setPeriod("PM");
    setIsOpen(false);
  };

  const preview = `${hour}:${minute} ${period}`;

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" id={id} name={name} value={value || ""} />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200/90 bg-white px-3.5 py-2.5 text-left text-sm text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/12 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:shadow-none dark:hover:border-white/[0.14] dark:hover:bg-white/[0.08] dark:focus-visible:ring-white/20 dark:focus-visible:ring-offset-[#141414]"
      >
        <span className={value ? "font-medium text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}>
          {value || placeholder}
        </span>
        <svg
          className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),17.5rem)] rounded-xl border border-gray-200/90 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-[#161616] sm:left-0 sm:right-auto sm:w-64">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Elegir hora</p>

          <div className="mb-1 flex flex-wrap items-end justify-center gap-x-1 gap-y-2">
            <div className="min-w-[3.25rem] flex-1">
              <label htmlFor={`${fieldPrefix}-h`} className="sr-only">
                Hora
              </label>
              <select
                id={`${fieldPrefix}-h`}
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className={selectClass}
                aria-label="Hora"
              >
                {HOURS_12.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <span
              className="mb-2 shrink-0 select-none text-lg font-light leading-none text-gray-400 dark:text-gray-500"
              aria-hidden
            >
              :
            </span>
            <div className="min-w-[3.25rem] flex-1">
              <label htmlFor={`${fieldPrefix}-m`} className="sr-only">
                Minutos
              </label>
              <select
                id={`${fieldPrefix}-m`}
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className={selectClass}
                aria-label="Minutos"
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[3.75rem] flex-1 basis-[3.75rem]">
              <label htmlFor={`${fieldPrefix}-p`} className="sr-only">
                Período
              </label>
              <select
                id={`${fieldPrefix}-p`}
                value={period}
                onChange={(e) => setPeriod(e.target.value as "AM" | "PM")}
                className={selectClass}
                aria-label="Antes o después del mediodía"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <p className="mb-3 text-center text-xs tabular-nums text-gray-500 dark:text-gray-400">{preview}</p>

          <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={clearTime}
              className="text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-200"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
