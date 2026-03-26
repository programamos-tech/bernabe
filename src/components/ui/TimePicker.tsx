"use client";

import { useState, useRef, useEffect } from "react";

interface TimePickerProps {
  value?: string | null;
  onChange?: (time: string | null) => void;
  placeholder?: string;
  id?: string;
  name?: string;
}

const HOURS_12 = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

export function TimePicker({
  value,
  onChange,
  placeholder = "Seleccionar hora",
  id,
  name,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState("07");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("PM");
  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isOpen) {
      if (hourListRef.current) {
        const selectedHour = hourListRef.current.querySelector("[data-selected]");
        if (selectedHour) {
          selectedHour.scrollIntoView({ block: "center" });
        }
      }
      if (minuteListRef.current) {
        const selectedMinute = minuteListRef.current.querySelector("[data-selected]");
        if (selectedMinute) {
          selectedMinute.scrollIntoView({ block: "center" });
        }
      }
    }
  }, [isOpen]);

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

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" id={id} name={name} value={value || ""} />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] text-left text-[#18301d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition bg-white dark:bg-[#252525] flex items-center justify-between"
      >
        <span className={value ? "text-[#18301d] dark:text-white" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <svg
          className="w-5 h-5 text-gray-400"
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
        <div className="absolute z-50 mt-2 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] shadow-xl p-4 w-72">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl font-bold text-[#0ca6b2]">{hour}</span>
            <span className="text-2xl font-bold text-gray-400">:</span>
            <span className="text-2xl font-bold text-[#0ca6b2]">{minute}</span>
            <span className="text-lg font-semibold text-[#18301d] dark:text-white ml-2">{period}</span>
          </div>

          <div className="flex gap-2 mb-4">
            {/* Hours */}
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-medium">Hora</p>
              <div 
                ref={hourListRef}
                className="h-40 overflow-y-auto rounded-xl bg-gray-50 dark:bg-[#252525] p-1 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {HOURS_12.map((h) => (
                  <button
                    key={h}
                    type="button"
                    data-selected={h === hour ? true : undefined}
                    onClick={() => setHour(h)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition
                      ${h === hour
                        ? "bg-[#0ca6b2] text-white"
                        : "text-[#18301d] dark:text-white hover:bg-gray-200 dark:hover:bg-[#333]"
                      }
                    `}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-medium">Minutos</p>
              <div 
                ref={minuteListRef}
                className="h-40 overflow-y-auto rounded-xl bg-gray-50 dark:bg-[#252525] p-1 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-selected={m === minute ? true : undefined}
                    onClick={() => setMinute(m)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition
                      ${m === minute
                        ? "bg-[#0ca6b2] text-white"
                        : "text-[#18301d] dark:text-white hover:bg-gray-200 dark:hover:bg-[#333]"
                      }
                    `}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM */}
            <div className="w-20">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-medium">Período</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setPeriod("AM")}
                  className={`w-full py-4 rounded-xl text-sm font-bold transition
                    ${period === "AM"
                      ? "bg-[#0ca6b2] text-white"
                      : "bg-gray-50 dark:bg-[#252525] text-[#18301d] dark:text-white hover:bg-gray-200 dark:hover:bg-[#333]"
                    }
                  `}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("PM")}
                  className={`w-full py-4 rounded-xl text-sm font-bold transition
                    ${period === "PM"
                      ? "bg-[#0ca6b2] text-white"
                      : "bg-gray-50 dark:bg-[#252525] text-[#18301d] dark:text-white hover:bg-gray-200 dark:hover:bg-[#333]"
                    }
                  `}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={clearTime}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#18301d] dark:hover:text-white transition"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-[#0ca6b2] text-white text-sm font-semibold rounded-lg hover:bg-[#0a8f99] transition"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
