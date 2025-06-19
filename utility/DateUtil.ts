export function getEventDuration(begin_at: string, end_at: string): string {
    const start = new Date(begin_at);
    const end = new Date(end_at);
    const diffMs = end.getTime() - start.getTime();
    if (isNaN(diffMs) || diffMs < 0) return "-";
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}min`;
}

export function getTimeUntilEvent(begin_at: string): string {
    const now = new Date();
    const start = new Date(begin_at);

    // Zera as horas para comparar apenas a data
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
    );

    const diffMs = startDate.getTime() - nowDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
        return `Faltam ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
    } else if (diffDays === 0) {
        return "Hoje";
    } else {
        return "Terminado";
    }
}
