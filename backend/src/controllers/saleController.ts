import { Request, Response, NextFunction } from 'express';
import { SaleService } from '../services/saleService';

export const getAllSales = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, customerId, employeeId, startDate, endDate } = req.query;
        const result = await SaleService.getAllSales({
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            customerId: customerId as string,
            employeeId: employeeId as string,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
        });
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getSaleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sale = await SaleService.getSaleById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
        res.json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};

export const createSale = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new Error('Unauthorized');
        const sale = await SaleService.createSale(req.body, req.user.id);
        res.status(201).json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};

export const deleteAllSales = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await SaleService.deleteAllSales();
        res.status(200).json({ success: true, message: 'All sales deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const confirmSale = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new Error('Unauthorized');
        const sale = await SaleService.confirmSale(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};
