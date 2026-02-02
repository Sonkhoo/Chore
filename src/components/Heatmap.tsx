
import React, { useState, useEffect } from 'react';
import '../App.css';

// Simple habit tracker day state: 0 = empty, 1 = half, 2 = full
export interface DayData {
    date: string;
    state: 0 | 1 | 2;
}

interface HeatmapProps {
    data: DayData[];
    onDayClick?: (date: string) => void;
}

export const Heatmap: React.FC<HeatmapProps> = ({ data, onDayClick }) => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [dayProgress, setDayProgress] = useState(0);
    const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [isProgressHovered, setIsProgressHovered] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState('');

    // Calculate day progress and time remaining
    useEffect(() => {
        const updateProgress = () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            const total = end.getTime() - start.getTime();
            const current = now.getTime() - start.getTime();
            setDayProgress((current / total) * 100);
            
            // Calculate time remaining
            const remaining = end.getTime() - now.getTime();
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            setTimeRemaining(`${hours}h ${minutes}m left today`);
        };

        updateProgress();
        const interval = setInterval(updateProgress, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate number of weeks to display based on window width
    const calculateWeeksToShow = () => {
        const availableWidth = windowWidth - 80;
        const weekWidth = 16; // 13px cell + 3px gap
        const maxWeeks = Math.floor(availableWidth / weekWidth);
        return Math.max(14, Math.min(52, maxWeeks));
    };

    const weeksToShow = calculateWeeksToShow();

    // Get weeks dynamically based on window width
    const getDisplayWeeks = () => {
        const weeks: DayData[][] = [];
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - ((weeksToShow - 1) * 7));
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        for (let week = 0; week < weeksToShow; week++) {
            const weekData: DayData[] = [];
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + week * 7 + day);
                const dateStr = currentDate.toISOString().split('T')[0];
                const dayData = data.find(d => d.date === dateStr) || {
                    date: dateStr,
                    state: 0
                };
                weekData.push(dayData);
            }
            weeks.push(weekData);
        }
        return weeks;
    };

    const weeks = getDisplayWeeks();

    // Handle click: cycle state 0 -> 1 -> 2 -> 0
    // Use the handler from props
    const handleDayClick = (date: string) => {
        if (onDayClick) onDayClick(date);
    };

    // Month labels
    const getMonthLabels = () => {
        const labels: { month: string; offset: number }[] = [];
        const weeks = getDisplayWeeks();

        const weekStridePx = 16; // matches left: offset * 16px
        const totalGridWidthPx = weeksToShow * weekStridePx;

        const estimateLabelWidthPx = (text: string) => {
            const rootFontSize =
                (typeof window !== 'undefined'
                    ? parseFloat(getComputedStyle(document.documentElement).fontSize)
                    : 13) || 13;
            const fontSizePx = rootFontSize * 0.65; // matches CSS: 0.65rem

            // Monospace-ish estimate + letter-spacing (0.06em)
            const charWidthPx = fontSizePx * 0.62;
            const letterSpacingPx = fontSizePx * 0.06;
            const textWidthPx = (text.length * charWidthPx) + (Math.max(0, text.length - 1) * letterSpacingPx);

            // tiny safety padding to avoid 1-2px overshoot
            return textWidthPx + 4;
        };

        let lastMonth: number | null = null;

        weeks.forEach((week, weekIndex) => {
            const referenceDay = new Date(week[0].date); // Sunday of the column
            const month = referenceDay.getMonth();

            if (month !== lastMonth) {
                const monthText = referenceDay
                    .toLocaleDateString('en-US', { month: 'short' })
                    .toLowerCase();

                const labelWidthPx = estimateLabelWidthPx(monthText);
                const maxLeftPx = Math.max(0, totalGridWidthPx - labelWidthPx);
                const maxOffset = Math.max(0, Math.floor(maxLeftPx / weekStridePx));

                labels.push({
                    month: monthText,
                    offset: Math.min(weekIndex, maxOffset)
                });
                lastMonth = month;
            }
        });

        return labels;
    };

    const monthLabels = getMonthLabels();

    // Get current date and time for footer
    const getCurrentDateTime = () => {
        const now = new Date();
        const date = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        return `${date}`;
    };

    // Render circle with vertical half-fill effect
    const renderCircle = (state: 0 | 1 | 2, dateStr?: string) => {
        const size = 13;
        const radius = 5.5;
        const center = size / 2;

        if (state === 0) {
            // Only show red cross for missed days in the past or today
            let isPastOrToday = true;
            if (dateStr) {
                const today = new Date();
                today.setHours(0,0,0,0);
                const cellDate = new Date(dateStr);
                cellDate.setHours(0,0,0,0);
                isPastOrToday = cellDate <= today;
            }
            if (isPastOrToday) {
                return (
                    <svg width={size} height={size}>
                        <circle cx={center} cy={center} r={radius} fill="var(--github-empty)" stroke="var(--github-border)" strokeWidth="0.5" />
                        <line x1={center-3} y1={center-3} x2={center+3} y2={center+3} stroke="#e93420b4" strokeWidth="1.0" strokeLinecap="round" />
                        <line x1={center+3} y1={center-3} x2={center-3} y2={center+3} stroke="#e93420b4" strokeWidth="1.0" strokeLinecap="round" />
                    </svg>
                );
            } else {
                // Future day: plain empty circle
                return (
                    <svg width={size} height={size}>
                        <circle cx={center} cy={center} r={radius} fill="var(--github-empty)" stroke="var(--github-border)" strokeWidth="0.5" />
                    </svg>
                );
            }
        }
        
        if (state === 1) {
            // Half filled (left 50% horizontally)
            return (
                <svg width={size} height={size}>
                    <defs>
                        <clipPath id="left-half">
                            <rect x="0" y="0" width={center} height={size} />
                        </clipPath>
                    </defs>
                    <circle cx={center} cy={center} r={radius} fill="var(--github-empty)" stroke="var(--github-border)" strokeWidth="0.5" />
                    <circle cx={center} cy={center} r={radius} fill="var(--github-full)" clipPath="url(#left-half)" />
                </svg>
            );
        }
        
        // Full circle
        return (
            <svg width={size} height={size}>
                <circle cx={center} cy={center} r={radius} fill="var(--github-full)" stroke="var(--github-border)" strokeWidth="0.5" />
            </svg>
        );
    };

    // Get state label for tooltip
    const getStateLabel = (state: 0 | 1 | 2): string => {
        if (state === 0) return 'No activity';
        if (state === 1) return 'Partial completion';
        return 'Completed';
    };

    const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
        setHoveredDay(day);
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setTooltipPos({ 
            x: rect.left + rect.width / 2, 
            y: rect.top - 8 
        });
    };
    
    return (
        <div className="widget-container">
            <div className="widget-header" data-tauri-drag-region>
                {getCurrentDateTime()}
            </div>
            <div className="heatmap-wrapper">
                <div className="heatmap-content">
                    <div className="day-labels">
                        <div className="day-label">mon</div>
                        <div className="day-label">tue</div>
                        <div className="day-label">wed</div>
                        <div className="day-label">thu</div>
                        <div className="day-label">fri</div>
                        <div className="day-label">sat</div>
                        <div className="day-label">sun</div>
                    </div>
                    <div className="grid-container">
                        <div className="month-labels">
                            {monthLabels.map((label, i) => (
                                <div
                                    key={i}
                                    className="month-label"
                                    style={{ left: `${label.offset * 16 + 8}px` }}
                                >
                                    {label.month}
                                </div>
                            ))}
                        </div>
                        <div className="heatmap-grid">
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="week-column">
                                    {week.map((day, dayIndex) => (
                                        <div
                                            key={`${weekIndex}-${dayIndex}`}
                                            className="day-cell"
                                            onClick={() => handleDayClick(day.date)}
                                            onMouseEnter={(e) => handleMouseEnter(day, e)}
                                            onMouseLeave={() => setHoveredDay(null)}
                                            title=""
                                        >
                                            {renderCircle(day.state, day.date)}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {hoveredDay && (
                <div
                    className="github-tooltip"
                    style={{
                        position: 'fixed',
                        left: `${tooltipPos.x}px`,
                        top: `${tooltipPos.y}px`,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="tooltip-state">{getStateLabel(hoveredDay.state)}</div>
                    <div className="tooltip-date-small">
                        {new Date(hoveredDay.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </div>
                </div>

            )}
            <div 
                className="progress-container"
                onMouseEnter={() => setIsProgressHovered(true)}
                onMouseLeave={() => setIsProgressHovered(false)}
            >
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${dayProgress}%` }}
                    />
                </div>
                {isProgressHovered && (
                    <div className="progress-tooltip">{timeRemaining}</div>
                )}
            </div>

            <div className="heatmap-legend">
                <span className="legend-item">◐ Github / Leetcode</span>
                <span className="legend-item">● Both</span>
            </div>

            <div className="widget-footer">
                {`${data.filter(d => d.state === 2).length} coding days this year`}
            </div>
        </div>
    );
};

