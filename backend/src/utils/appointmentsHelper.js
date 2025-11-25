/**
 * Utilities
 */
export function toWeekday(dateStr) {
    // JS: 0=Sunday ... 6=Saturday (same as our schema)
    return new Date(dateStr + "T00:00:00Z").getUTCDay();
}

export function hhmmToMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

export function timeToMinutes(t) {
    // 'HH:MM:SS' from Postgres time; tolerate 'HH:MM'
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

export function minutesToHHMM(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
}

/**
 * Build working windows in minutes from midnight, removing breaks.
 */
export function buildWindows(hoursRows, breaksRows) {
    // Start with raw windows
    let windows = hoursRows
        .filter(r => r.is_open)
        .map(r => ({
            start: timeToMinutes(r.open_time),
            end: timeToMinutes(r.close_time)
        }))
        .filter(w => w.end > w.start);

    // Subtract breaks
    const breaks = (breaksRows || []).map(b => ({
        start: timeToMinutes(b.start_time),
        end: timeToMinutes(b.end_time)
    })).filter(b => b.end > b.start);

    if (breaks.length === 0) return windows;

    // For each window, subtract all breaks (may split windows)
    const result = [];
    for (const w of windows) {
        let segments = [{ ...w }];
        for (const br of breaks) {
            const next = [];
            for (const seg of segments) {
                // no overlap
                if (br.end <= seg.start || br.start >= seg.end) {
                    next.push(seg);
                    continue;
                }
                // full cover -> drop
                if (br.start <= seg.start && br.end >= seg.end) {
                    continue;
                }
                // overlap left
                if (br.start <= seg.start && br.end < seg.end) {
                    next.push({ start: br.end, end: seg.end });
                    continue;
                }
                // overlap right
                if (br.start > seg.start && br.end >= seg.end) {
                    next.push({ start: seg.start, end: br.start });
                    continue;
                }
                // split middle
                if (br.start > seg.start && br.end < seg.end) {
                    next.push({ start: seg.start, end: br.start });
                    next.push({ start: br.end, end: seg.end });
                    continue;
                }
            }
            segments = next;
        }
        result.push(...segments);
    }
    // Normalize (merge adjacent)
    result.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const seg of result) {
        if (!merged.length) merged.push(seg);
        else {
            const last = merged[merged.length - 1];
            if (last.end === seg.start) last.end = seg.end;
            else merged.push(seg);
        }
    }
    return merged;
}

/**
 * Generate slots from windows using slotMinutes granularity.
 * Returns array of HH:MM strings.
 */
export function generateSlotsForWindows(windows, slotMinutes) {
    const out = [];
    for (const w of windows) {
        // allow slot start at w.start, last start at w.end - slotMinutes
        for (let t = w.start; t + slotMinutes <= w.end; t += slotMinutes) {
            out.push(minutesToHHMM(t));
        }
    }
    return out;
}

/**
 * Check slot conflicts against appointments for the same date.
 * Appointments have confirmed_time and (optional) service_name to compute duration.
 */
export function filterSlotsAgainstAppointments(slotsHHMM, slotMinutes, appts, serviceDurationsMap) {
    // Convert appointments to minute intervals
    const apptIntervals = (appts || []).map(a => {
        const startISO = a.confirmed_time || a.requested_time;
        if (!startISO) return null;
        const start = new Date(startISO);
        const startMins = start.getUTCHours() * 60 + start.getUTCMinutes();

        const dur = (a.service_name && serviceDurationsMap[a.service_name]) || 30;
        return { start: startMins, end: startMins + dur };
    }).filter(Boolean);

    return slotsHHMM.map(s => {
        const sStart = hhmmToMinutes(s);
        const sEnd = sStart + slotMinutes;
        const conflict = apptIntervals.some(iv => overlaps(sStart, sEnd, iv.start, iv.end));
        return { time: s, available: !conflict };
    }).filter(x => x.available); // return only free slots
}
