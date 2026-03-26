"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  minYear?: number;
  maxYear?: number;
}

const DAYS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTHS_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  id,
  name,
  minYear = 1920,
  maxYear = new Date().getFullYear(),
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"calendar" | "year" | "month">("calendar");
  const [currentMonth, setCurrentMonth] = useState(
    value ? value.getMonth() : new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    value ? value.getFullYear() : new Date().getFullYear()
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setView("calendar");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (view === "year" && yearListRef.current) {
      const selectedYearEl = yearListRef.current.querySelector("[data-selected]");
      if (selectedYearEl) {
        selectedYearEl.scrollIntoView({ block: "center" });
      }
    }
  }, [view]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectDate = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onChange?.(newDate);
    setIsOpen(false);
  };

  const clearDate = () => {
    onChange?.(null);
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    return (
      value.getDate() === day &&
      value.getMonth() === currentMonth &&
      value.getFullYear() === currentYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" id={id} name={name} value={value?.toISOString() || ""} />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] text-left text-[#18301d] dark:text-white focus:outline-none transition bg-white dark:bg-[#252525] flex items-center justify-between"
      >
        <span className={value ? "text-[#18301d] dark:text-white" : "text-gray-400"}>
          {value ? formatDate(value) : placeholder}
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
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] shadow-xl p-4 w-80">
          {view === "calendar" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-500 dark:text-gray-400 hover:text-[#18301d] dark:hover:text-white transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setView("month")}
                    className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] font-medium text-[#18301d] dark:text-white transition"
                  >
                    {MONTHS[currentMonth]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("year")}
                    className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] font-medium text-[#18301d] dark:text-white transition"
                  >
                    {currentYear}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-500 dark:text-gray-400 hover:text-[#18301d] dark:hover:text-white transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day, i) => (
                  <div key={i} className="text-center text-xs font-medium text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => (
                  <div key={i} className="aspect-square">
                    {day && (
                      <button
                        type="button"
                        onClick={() => selectDate(day)}
                        className={`w-full h-full rounded-lg text-sm font-medium transition flex items-center justify-center
                          ${isSelected(day)
                            ? "bg-[#0ca6b2] text-white"
                            : isToday(day)
                            ? "bg-[#0ca6b2]/10 dark:bg-[#0ca6b2]/20 text-[#0ca6b2]"
                            : "text-[#18301d] dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
                          }
                        `}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={clearDate}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#18301d] dark:hover:text-white transition"
                >
                  Borrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setCurrentMonth(today.getMonth());
                    setCurrentYear(today.getFullYear());
                    selectDate(today.getDate());
                  }}
                  className="text-sm font-medium text-[#0ca6b2] hover:text-[#0a8f99] transition"
                >
                  Hoy
                </button>
              </div>
            </>
          )}

          {view === "year" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setView("calendar")}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-500 dark:text-gray-400 hover:text-[#18301d] dark:hover:text-white transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="font-medium text-[#18301d] dark:text-white">Seleccionar año</span>
                <div className="w-9" />
              </div>
              <div ref={yearListRef} className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    data-selected={year === currentYear ? true : undefined}
                    onClick={() => {
                      setCurrentYear(year);
                      setView("calendar");
                    }}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition
                      ${year === currentYear
                        ? "bg-[#0ca6b2] text-white"
                        : "text-[#18301d] dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
                      }
                    `}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </>
          )}

          {view === "month" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setView("calendar")}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-500 dark:text-gray-400 hover:text-[#18301d] dark:hover:text-white transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="font-medium text-[#18301d] dark:text-white">Seleccionar mes</span>
                <div className="w-9" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MONTHS_SHORT.map((month, i) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => {
                      setCurrentMonth(i);
                      setView("calendar");
                    }}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition
                      ${i === currentMonth
                        ? "bg-[#0ca6b2] text-white"
                        : "text-[#18301d] dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
                      }
                    `}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
