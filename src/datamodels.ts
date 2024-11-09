export interface Machines {
    id: string,
    title: string,
    muscles: String[],
}

export interface TrainingSessions{
    id: string,
    start_date:Date,
    end_date: Date,
    machines: String[],
}