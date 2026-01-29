import React, { useState, useEffect } from 'react';
import '../App.css';

export interface DayData {
    date: string;
    github: number;
    leetcode: number;
}

interface HeatmapProps {
    data: DayData[];
}

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
    const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState({ x: 0, y: 0 });
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // Listen for window resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate number of weeks to display based on window width
    const calculateWeeksToShow = () => {
        // Base calculation: cellWidth(10px) + gap(2.5px) = 12.5px per week
        // Account for padding (32px), day labels (~30px), and some margin
        const availableWidth = windowWidth - 80;
        const weekWidth = 12.5;
        const maxWeeks = Math.floor(availableWidth / weekWidth);

        // Constrain between 14 weeks (min) and 52 weeks (max/1 year)
        return Math.max(14, Math.min(52, maxWeeks));
    };

    const weeksToShow = calculateWeeksToShow();

    // Calculate current streak
    const calculateStreak = () => {
        let streak = 0;
        const sortedData = [...data].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        for (const day of sortedData) {
            if (day.github > 0 || day.leetcode > 0) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };

    const getColor = (github: number, leetcode: number): string => {
        if (github > 0 && leetcode > 0) {
            return 'var(--cell-done)';
        }

        if (github > 0 || leetcode > 0) {
            return 'var(--cell-partial)';
        }

        return 'var(--cell-missed)';
    };

    // Get weeks dynamically based on window width
    const getDisplayWeeks = () => {
        const weeks: DayData[][] = [];
        const today = new Date();
        const startDate = new Date(today);
        // Go back based on calculated weeks
        startDate.setDate(today.getDate() - ((weeksToShow - 1) * 7));

        // Start from Sunday
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
                    github: 0,
                    leetcode: 0
                };

                weekData.push(dayData);
            }
            weeks.push(weekData);
        }
        return weeks;
    };

    // Get month labels
    const getMonthLabels = () => {
        const labels: { month: string; offset: number }[] = [];
        const weeks = getDisplayWeeks();
        let lastMonth = -1;

        weeks.forEach((week, index) => {
            const month = new Date(week[0].date).getMonth();
            if (month !== lastMonth && index > 0) {
                labels.push({
                    month: new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' }).toLowerCase(),
                    offset: index
                });
                lastMonth = month;
            }
        });

        return labels;
    };

    const weeks = getDisplayWeeks();
    const monthLabels = getMonthLabels();
    const currentStreak = calculateStreak();

    const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
        setHoveredDay(day);
        const rect = (event.target as HTMLElement).getBoundingClientRect();

        // Calculate smart tooltip position
        const tooltipWidth = 120; // Increased to fit content properly
        const tooltipHeight = 100;
        const offset = 14;
        const edgePadding = 10;

        let x = rect.left + rect.width / 2;
        let y = rect.top - tooltipHeight - offset;

        // Check right edge overflow
        if (x + tooltipWidth / 2 > window.innerWidth - edgePadding) {
            x = window.innerWidth - tooltipWidth / 2 - edgePadding;
        }
        // Check left edge overflow
        if (x - tooltipWidth / 2 < edgePadding) {
            x = tooltipWidth / 2 + edgePadding;
        }

        // Check top overflow - show below if needed
        if (y < edgePadding) {
            y = rect.bottom + offset;
        }

        // Check bottom overflow when showing below
        if (y + tooltipHeight > window.innerHeight - edgePadding) {
            // If it doesn't fit below either, position it beside the cell
            y = rect.top - tooltipHeight / 2 + rect.height / 2;
            // Clamp to visible area
            y = Math.max(edgePadding, Math.min(y, window.innerHeight - tooltipHeight - edgePadding));
        }

        setHoveredPosition({ x, y });
    };

    const getCurrentTime = () => {
        const now = new Date();
        return now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        });
    };

    return (
        <div className="widget-container">
            <div className="widget-header" data-tauri-drag-region>
                <div className="streak-badge">
                    🔥 {currentStreak}-day streak
                </div>
            </div>

            <div className="heatmap-wrapper">
                <div className="month-labels">
                    {monthLabels.map((label, i) => (
                        <div
                            key={i}
                            className="month-label"
                            style={{ left: `${label.offset * 12.5 + 28}px` }}
                        >
                            {label.month}
                        </div>
                    ))}
                </div>

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

                    <div className="heatmap-grid">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="week-column">
                                {week.map((day, dayIndex) => (
                                    <div
                                        key={`${weekIndex}-${dayIndex}`}
                                        className="day-cell"
                                        style={{
                                            backgroundColor: getColor(day.github, day.leetcode),
                                        }}
                                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                                        onMouseLeave={() => setHoveredDay(null)}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {hoveredDay && (
                <div
                    className="tooltip"
                    style={{
                        position: 'fixed',
                        left: `${hoveredPosition.x}px`,
                        top: `${hoveredPosition.y}px`,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="tooltip-date">
                        {new Date(hoveredDay.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </div>
                    <div className="tooltip-stats">
                        <div className="stat-row">
                            <span className="stat-dot github"></span>
                            <span>Github: {hoveredDay.github}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-dot leetcode"></span>
                            <span>LeetCode: {hoveredDay.leetcode}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="widget-footer">
                {getCurrentTime()}
            </div>
        </div>
    );
};