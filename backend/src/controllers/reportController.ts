import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/reportService';

export const getSalesSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query;
        const result = await ReportService.getSalesSummary(
            startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate ? new Date(endDate as string) : new Date()
        );
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getCategoryPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ReportService.getCategoryPerformance();
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getStockValuation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ReportService.getStockValuation();
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
