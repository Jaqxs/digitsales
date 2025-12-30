import * as React from "react"
import { CalendarIcon } from "lucide-react"
import {
    addDays,
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subMonths,
    startOfDay,
    endOfDay
} from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
    className?: string
    date?: DateRange | undefined
    setDate?: (date: DateRange | undefined) => void
}

export function DateRangePicker({
    className,
    date,
    setDate,
}: DateRangePickerProps) {
    const [selectedPreset, setSelectedPreset] = React.useState<string>('');

    const handlePresetSelect = (preset: string) => {
        if (!setDate) return;
        const today = new Date();
        setSelectedPreset(preset);

        switch (preset) {
            case 'today':
                setDate({ from: startOfDay(today), to: endOfDay(today) });
                break;
            case 'yesterday':
                const yesterday = addDays(today, -1);
                setDate({ from: startOfDay(yesterday), to: endOfDay(yesterday) });
                break;
            case 'week':
                setDate({
                    from: startOfWeek(today, { weekStartsOn: 1 }),
                    to: endOfWeek(today, { weekStartsOn: 1 })
                });
                break;
            case 'last_7_days':
                setDate({
                    from: startOfDay(addDays(today, -6)),
                    to: endOfDay(today)
                });
                break;
            case 'month':
                setDate({ from: startOfMonth(today), to: endOfMonth(today) });
                break;
            case 'year':
                setDate({ from: startOfYear(today), to: endOfYear(today) });
                break;
        }
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-auto justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "MMM dd, y")} -{" "}
                                    {format(date.to, "MMM dd, y")}
                                </>
                            ) : (
                                format(date.from, "MMM dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex items-center gap-1 p-2 border-b border-border oveflow-x-auto">
                        <Button
                            variant={selectedPreset === 'today' ? "default" : "ghost"}
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handlePresetSelect('today')}
                        >
                            Today
                        </Button>
                        <Button
                            variant={selectedPreset === 'yesterday' ? "default" : "ghost"}
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handlePresetSelect('yesterday')}
                        >
                            Yesterday
                        </Button>
                        <Button
                            variant={selectedPreset === 'week' ? "default" : "ghost"}
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handlePresetSelect('week')}
                        >
                            Week
                        </Button>
                        <Button
                            variant={selectedPreset === 'last_7_days' ? "default" : "ghost"}
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handlePresetSelect('last_7_days')}
                        >
                            Last 7 Days
                        </Button>
                        <Button
                            variant={selectedPreset === 'month' ? "default" : "ghost"}
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handlePresetSelect('month')}
                        >
                            Month
                        </Button>
                        <Button
                            variant={selectedPreset === 'year' ? "default" : "ghost"}
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handlePresetSelect('year')}
                        >
                            Year
                        </Button>
                    </div>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={(newDate) => {
                            setDate?.(newDate);
                            setSelectedPreset('');
                        }}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
